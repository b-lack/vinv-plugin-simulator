import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import Draw from 'ol/interaction/Draw';

import {fromLonLat, transform} from 'ol/proj';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';

import {Fill, Stroke, Circle, Style} from 'ol/style';


import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON';

import PPP from './geoPPP';




export default class OlMap{
    constructor(){
        this.radius = 2;
        
        var styles = {
            '0': new Style({
              image: new Circle({
                radius: this.radius,
                fill: new Fill({color: '#fffb00'}),
                stroke: new Stroke({color: '#bada55', width: 1}),
              }),
            }),
            '1': new Style({
                image: new Circle({
                  radius: this.radius,
                  fill: new Fill({color: '#00ff40'}),
                  stroke: new Stroke({color: '#bada55', width: 1}),
                }),
              }),
            '2': new Style({
                image: new Circle({
                    radius: this.radius,
                    fill: new Fill({color: '#2e2e2e'}),
                    stroke: new Stroke({color: '#bada55', width: 1}),
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
        var vector = new VectorLayer({
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
        
        this.map = new Map({
            target: 'map',
            layers: [
              new TileLayer({
                source: new OSM(),
                
              }), 
              vector,
              this.treeVector
            ],
            view: new View({
              center: fromLonLat([13.9581204, 47.4072281]),
              zoom: 17
            })
        });

        

        this.addInteration()
        this.initEvents()
    }
    initEvents(){
        const that = this;
        this.map.addEventListener('dblclick', (e) => that.buildFromCoordinate(e))
        this.draw.on('drawend', (e) => that.drawEnd(e))
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
    buildFromCoordinate(e){
        console.log(e.coordinate);
        e.stopPropagation();
    }
    startPP(polygon, coordinates){
        var that = this;
        this.PPP.poisson3(polygon, coordinates, this.radius); //ONE px =  ONE METER
        const points = this.PPP.getAll();
        console.log(points);
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
        that.PPP.calResult();
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