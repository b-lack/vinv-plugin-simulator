import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import Draw from 'ol/interaction/Draw';

import {fromLonLat, transform, toLonLat} from 'ol/proj';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';

import {Fill, Stroke, Circle, Style} from 'ol/style';
import CircleGeo from 'ol/geom/Circle';

import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON';

import PPP from './geoPPP';
import Polygon from 'ol/geom/Polygon';

const treeSpecies = {
    "0":{probability:10.4, name_en: 'Oak', name_sc:'Quercus', c:0, count:0, density:0},
    "1":{probability:16.4, name_en: 'Beech', name_sc:'Fagus sylvatica', c:0, count:0, density:0},
    "2":{probability:17.6, name_en: 'other Broad-leaved species', name_sc:'', c:0, count:0, density:0},

    "3":{probability:25.4, name_en: 'Spruce', name_sc:'Picea', c:0, count:0, density:0},
    "4":{probability:2.7, name_en: 'Fir', name_sc:'Abies', c:0, count:0, density:0},
    "5":{probability:2, name_en: 'Douglas-fir', name_sc:'Pseudotsuga menziesii', c:0, count:0, density:0},
    "6":{probability:22.7, name_en: 'Pine', name_sc:'Pinus', c:0, count:0, density:0},
    "7":{probability:2.8, name_en: 'Larch', name_sc:'Larix', c:0, count:0, density:0},
};

let nextTree = 0;
const polygon = [
    [
      [
        13.958162069320677,
        47.40634440671768
      ],
      [
        13.959905505180359,
        47.40634440671768
      ],
      [
        13.959905505180359,
        47.407676823143454
      ],
      [
        13.958162069320677,
        47.407676823143454
      ],
      [
        13.958162069320677,
        47.40634440671768
      ]
    ]
  ];


export default class OlMap{
    constructor(){
        this.radius = 2;
        
        var styles = {
            '0': new Style({
              image: new Circle({
                radius: this.radius,
                fill: new Fill({color: '#ff0000'}),
                //stroke: new Stroke({color: '#bada55', width: 1}),
              }),
            }),
            '1': new Style({
                image: new Circle({
                  radius: this.radius,
                  fill: new Fill({color: '#ff00ff'}),
                  //stroke: new Stroke({color: '#bada55', width: 1}),
                }),
              }),
            '2': new Style({
                image: new Circle({
                    radius: this.radius,
                    fill: new Fill({color: '#00ff00'}),
                    //stroke: new Stroke({color: '#bada55', width: 1}),
                }),
            }),
            '3': new Style({
                image: new Circle({
                    radius: this.radius,
                    fill: new Fill({color: '#ff0000'}),
                    stroke: new Stroke({color: '#bada55', width: 1}),
                }),
            }),
            '4': new Style({
                image: new Circle({
                    radius: this.radius,
                    fill: new Fill({color: '#0400ff'}),
                    stroke: new Stroke({color: '#bada55', width: 1}),
                }),
            }),
            '5': new Style({
                image: new Circle({
                    radius: this.radius,
                    fill: new Fill({color: '#ffffff'}),
                    stroke: new Stroke({color: '#bada55', width: 1}),
                }),
            }),
            '6': new Style({
                image: new Circle({
                    radius: this.radius,
                    fill: new Fill({color: '#00ff40'}),
                    stroke: new Stroke({color: '#bada55', width: 1}),
                }),
            }),
            '7': new Style({
                image: new Circle({
                    radius: this.radius,
                    fill: new Fill({color: '#b9b9b9'}),
                    stroke: new Stroke({color: '#bada55', width: 1}),
                }),
            }),
        };
        
        this.PPP = new PPP('ge-canvas-one');

        this.geoJson = new GeoJSON();
        this.draw;

        this.source = new VectorSource({wrapX: false});
        this.vector = new VectorLayer({
          source: this.source,
          format: new GeoJSON()
        });


        this.treeSource = new VectorSource();
        this.treeVector = new VectorLayer({
          source: this.treeSource,
          format: new GeoJSON(),
          style: function (feature) {
            return styles[feature.getProperties().species];
          },
        });

        this.cursorSource = new VectorSource();
        this.cursorVector = new VectorLayer({
          source: this.cursorSource,
        });

        this.refSource = new VectorSource();
        this.refVector = new VectorLayer({
          source: this.refSource,
        });

        this.referenceSource = new VectorSource();
        this.referenceVector = new VectorLayer({
          source: this.referenceSource,
          style: function (feature) {
            return styles[feature.getProperties().species];
            },
        });
        
        this.map = new Map({
            target: 'map',
            layers: [
              /*new TileLayer({
                source: new OSM(),
                
              }), */
              this.vector,
              this.treeVector,
              this.refVector,
              this.referenceVector,
              this.cursorVector
            ],
            view: new View({
              center: fromLonLat([13.9581204, 47.4072281]),
              zoom: 17
            })
        });
        const that = this;
        
        //this.addInteration()
        this.addPointInteration()
        //this.initEvents()
        this.initPointEvents()
        this.addCursor()
        this.addReference(); // probekreis
        this.addRefPolygon();

        this.map.on('moveend', function(e){that.onMoveEnd(e)});

    }
    changeTree(e){
        nextTree = this.value;
    }
    addRefPolygon(){

        const creferenceViewpoly = new Polygon( 
            polygon, //center,
        ).transform('EPSG:4326', 'EPSG:3857');
        var polyreferenceFeature = new Feature(creferenceViewpoly);
        this.cursorSource.addFeature(polyreferenceFeature);
        console.log(creferenceViewpoly.getArea());
    }

    onMoveEnd(event){
        this.cursorSource.clear();
        this.addCursor();
        this.addRefPolygon();
        return;
    }
    addReference(){
        var center = [1553500.8553592043, 6009099.234273125];
        
        const creferenceViewRadius = new CircleGeo( 
            center,//center,
            50 // Radius in Meter
        );
        this.referenceFeature = new Feature(creferenceViewRadius);
        this.refSource.addFeature(this.referenceFeature);

        //console.log('creferenceViewRadius', this.referenceFeature.geometry.getArea());
    }
    addCursor(){
        var center = this.map.getView().getCenter();

        const cursorViewRadius = new CircleGeo( 
            center,//center,
            100 // Radius in Meter
            
        );
        this.cursorFeature = new Feature(cursorViewRadius);
        this.cursorSource.addFeature(this.cursorFeature);
    }
    initEvents(){
        const that = this;
        this.map.addEventListener('dblclick', (e) => that.buildFromCoordinate(e))
        this.draw.on('drawend', (e) => that.drawEnd(e))
    }
    initPointEvents(){
        const that = this;
        //this.map.addEventListener('dblclick', (e) => that.buildFromCoordinate(e))
        this.draw.on('drawend', (e) => that.drawPointEnd(e))
    }
    drawPointEnd(e){
        
        var tree = new Point( 
            e.feature.getGeometry().getCoordinates(),
            Style
        );
        var feature = new Feature({
            species: nextTree,//Math.round(Math.random() * 7),
            geometry: tree
        });
        this.referenceSource.addFeature(feature);
        this.calculatePlot(this.referenceSource);
        this.source.clear();
    }
    drawEnd(e){
        const area = e.feature.getGeometry().getArea();
        document.getElementById('ge-area-size').innerHTML = 'Area size: ' + this.formatArea(area);
        if(area> (1000 * 1000)){
            
            console.error('!! Bigger than 1ha');
            //return;
        }
        console.log('AREA SIZE: ' + area);
        this.source.clear();
        var geoJson = this.geoJson.writeFeature(e.feature, {featureProjection: 'EPSG:3857'});
        var parsetJson = JSON.parse(geoJson);
        this.setRandomPointInPolygon(parsetJson.geometry.coordinates);
    }
    formatArea(area){
        var output;
        if (area > 10000) {
            output = Math.round((area / 1000000) * 100)  + ' ' + 'ha';
            //output = Math.round((area / 1000000) * 100) / 100 + ' ' + 'km<sup>2</sup>';
        } else {
            output = Math.round(area * 100) / 100 + ' ' + 'm<sup>2</sup>';
        }
        return output;
    }
    setRandomPointInPolygon(coordinates){
        var polygon = turf.polygon(coordinates);
        var pointOnPolygon = turf.pointOnFeature(polygon);

        /*var tree = new Point(fromLonLat(pointOnPolygon.geometry.coordinates),);
        var feature = new Feature({
            name: "Thing",
            geometry: tree
        });
        console.log(pointOnPolygon.geometry.coordinates);
        this.treeSource.addFeature(feature);*/

        this.startPP(polygon, pointOnPolygon.geometry.coordinates);
    }
    addInteration(){ //Polygon
        this.draw = new Draw({
            source: this.source,
            type: 'Polygon',
        });
        this.map.addInteraction(this.draw);
    }
    addPointInteration(){ //Point
        this.draw = new Draw({
            source: this.source,
            type: 'Point',
        });
        this.map.addInteraction(this.draw);
    }
    buildFromCoordinate(e){
        console.log(e.coordinate);
        e.stopPropagation();
    }
    refresh(){
        this.setRandomPointInPolygon(polygon);
    }
    calculatePlot(source){
        console.log('HAllo');
        //{probability:10.4, name_en: 'Oak', name_sc:'Quercus', c:0}
        var features = source.getFeatures();
        var species = {};
        var countTrees = 0;
        for(var feature in features){
            countTrees ++;
            if(!species[features[feature].getProperties().species]){
                const spec = Object.assign({minDistance:50, maxDistance:0}, treeSpecies[features[feature].getProperties().species]);
                species[features[feature].getProperties().species] = spec
            }
            species[features[feature].getProperties().species].count ++;
            
        }
        for(let i in species){
            species[i].probability = species[i].count * 100 / countTrees;
        }
        //this.radius = 50/2;
        this.radius = this.calRadius(features, 50, species);
        console.log('this.radius: ', this.radius);
        this.PPP.setSpecies(species);
        this.startByPlot();
    }
    calDistances(from, to){ // in METER

        var from = turf.point(from);
        var to = turf.point(to);
        
        var distance = turf.distance(from, to);
        return Math.ceil(distance * 1000);
    }
    calDensity(features, maxRadius, species){
        
        
        for(var i = 0; i<features.length; i++){
            species[features[i].getProperties().species].c++;
        }

        var int = Math.pow(Math.PI*50, 2);

        for(var i in species){
            var r = Math.sqrt(int / species[i].c / Math.PI)/2;
            species[i].density = r;
        };
        
        return 50;
    }
    calRadius(features, maxRadius, species){
        let minRadius = maxRadius;
        //var features = source.getFeatures();

        if(features.length<2) return minRadius / features.length;

        for(var feature in features){
            for(var feature2 in features){
                if(feature != feature2){
                    const distance = this.calDistances(toLonLat(features[feature].getGeometry().getCoordinates()), toLonLat(features[feature2].getGeometry().getCoordinates()))/2;
                    species[features[feature].getProperties().species].minDistance = Math.min(distance, species[features[feature].getProperties().species].minDistance);
                    species[features[feature].getProperties().species].maxDistance = Math.max(distance, species[features[feature].getProperties().species].maxDistance);
                    minRadius = Math.min(minRadius, species[features[feature].getProperties().species].minDistance);
                }
            }
        }
        this.calDensity(features, maxRadius, species);
        console.log(species);

        return minRadius;
    }
    // Radius = 50
    // 
    startByPlot(){
        this.setRandomPointInPolygon(polygon);
    }
    startPP(polygon, coordinates){
        if(this.source.getFeatures()<2) return;
        var that = this;
        this.PPP.poisson3(polygon, coordinates, this.radius); //ONE px =  ONE METER
        const points = this.PPP.getAll();

        that.treeSource.clear();
        for(var i=0; i<points.length; i++){
            var tree = new Point( 
                fromLonLat([points[i].x,points[i].y]),
                Style
            );
            var feature = new Feature({
                species: points[i].s,
                geometry: tree
            });
            that.treeSource.addFeature(feature);
        }
        //that.PPP.calResult();

        // DO NOT DELETE
        /*function letsDraw(){
            var res = that.PPP.drawing();
            that.PPP.calResult();
            
            for(var i=0; i<res.newPoints.length; i++){
                var tree = new Point( 
                    fromLonLat([res.newPoints[i].x,res.newPoints[i].y]),
                    Style
                );
                var feature = new Feature({
                    species: res.newPoints[i].s,
                    geometry: tree
                });
                that.treeSource.addFeature(feature);
            }

            if(res.spawnPoints>0)
                setTimeout(() => letsDraw(), 1);
            else{
                
                console.log('finish');
                return;
            }
        }
        letsDraw();*/
    }
}