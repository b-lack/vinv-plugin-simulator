import * as turf from '@turf/turf'

export default class GeoPoissonPointProcess{
    constructor(canvasId){
        this.canvas = document.getElementById('ge-canvas-one');
        this.treeSpecies = {
            "0":{probability:10.4, name_en: 'Oak', name_sc:'Quercus', c:0},
            "1":{probability:16.4, name_en: 'Beech', name_sc:'Fagus sylvatica', c:0},
            "2":{probability:17.6, name_en: 'other Broad-leaved species', name_sc:'', c:0},

            "3":{probability:25.4, name_en: 'Spruce', name_sc:'Picea', c:0},
            "4":{probability:2.7, name_en: 'Fir', name_sc:'Abies', c:0},
            "5":{probability:2, name_en: 'Douglas-fir', name_sc:'Pseudotsuga menziesii', c:0},
            "6":{probability:22.7, name_en: 'Pine', name_sc:'Pinus', c:0},
            "7":{probability:2.8, name_en: 'Larch', name_sc:'Larix', c:0},
        };
        //this.initSpecies();
    }
    /*initSpecies(){
        for(var i = 0; i < this.treeSpecies.length; i++){
            document.getElementById('species-is-' + i).innerHTML = this.treeSpecies[i].probability +  ' %';
        }
    }*/
    setSpecies(species){
        
        this.treeSpecies = species;
    }
    printPoint(x, y, r, s){
        const pointDiv = document.createElement('div');
        pointDiv.classList.add('point');
        pointDiv.classList.add('r-' + r);
        pointDiv.classList.add('species-'+s);
        pointDiv.style.bottom = Math.round(y) + 'px';
        pointDiv.style.left = x + 'px';
        pointDiv.style.width = r + 'px';
        pointDiv.style.height = r + 'px';
        this.canvas.appendChild(pointDiv);
    }
    //https://www.youtube.com/watch?v=7WcmyxyFO7o
    updatePointCount(){
        console.log(this.points.length);
    }
    calDistances(from, to){ // in METER
        var from = turf.point(from);
        var to = turf.point(to);
        
        var distance = turf.distance(from, to);
        return Math.ceil(distance * 1000);
    }
    poisson3(polygon, startCoordinates, radius){
        this.maxRadius = 0;
        for(let tree in this.treeSpecies){
            this.maxRadius = Math.max(this.maxRadius, this.treeSpecies[tree].maxDistance);
        }
        this.startCoordinates = startCoordinates;
        //[LON, LAT]
        //LON <- X
        //lat <- y
        this.basePolygon = polygon;
        this.bbox = turf.bbox(polygon); // minX, minY, maxX, maxY 
        this.coordReference = [];

        //.log(this.bbox);
        //console.log(startCoordinates);

        this.bboxWidth = this.calDistances([this.bbox[0], this.bbox[1]], [this.bbox[2], this.bbox[1]]);
        this.bboxHeight = this.calDistances([this.bbox[0], this.bbox[1]], [this.bbox[0], this.bbox[3]]);
        
        //console.log('bboxWidth: ' + this.bboxWidth); //oben
        //console.log('bboxHeight: ' + this.bboxHeight); //oben

        const that = this;
        this.canvas.innerHTML = "";

        this.numSamplesBeforeRejection = 30; // bricht nach 30 Versuchen ab
        this.radius = radius; // Minimale Entfernung zwischen Punkten
        //console.log('gridRadius: ', this.radius);
        this.cellsize = this.radius / Math.sqrt(2); // Pythagoras
        

        this.grid = []; //width // height
        //console.log('cellsize: ', this.cellsize);
        for(var i=0;i<Math.round(this.bboxWidth / this.cellsize);i++){
            const cols = [];
            for(var j=0;j<Math.round(this.bboxHeight / this.cellsize);j++){
                cols.push(null);
            }
            this.grid.push(cols);
        }

        this.points = [];
        this.spawnPoints = [];

        var speciesId = this.treeByProbability();

        var nRad = this.treeSpecies[speciesId].minDistance + Math.random() * (this.treeSpecies[speciesId].maxDistance - this.treeSpecies[speciesId].minDistance);
        this.spawnPoints.push({
            x:this.startCoordinates[0], 
            y:this.startCoordinates[1], 
            r: nRad,
            s: speciesId
        }); // Start
        console.log(nRad);

    }
    getAll(){
        this.newPoints = [];

        while(this.spawnPoints.length > 0){
            this.calNewPoints();
        }
        console.log(this.points);
        return this.points;
    }
    drawing(){

        this.newPoints = [];

        if(this.spawnPoints.length > 0){
            this.calNewPoints();
        }
        return {newPoints: this.newPoints, spawnPoints: this.spawnPoints.length};
    }
    Gcounter = 0
    calNewPoints(){
        
        const spawnIndex = Math.ceil(Math.random() * (this.spawnPoints.length-1));
        const spawnCenter = this.spawnPoints[spawnIndex];

        let neighborExcepted = false;
        for(let i = 0; i<this.numSamplesBeforeRejection; i++){
            var speciesId = this.treeByProbability();
            var nRad = this.treeSpecies[speciesId].minDistance /*+ Math.random() * (this.treeSpecies[speciesId].maxDistance - this.treeSpecies[speciesId].minDistance)*/;

            const angle = Math.random() * 360 - 180;
            var pt = turf.point([spawnCenter.x, spawnCenter.y]);

            var distance = Math.max(spawnCenter.r+nRad) / 1000; // (Math.random() * this.radius + this.radius) / 1000;
            var bearing = angle;

            var destination = turf.rhumbDestination(pt, distance, bearing);
            
            
            
            const neighbor = {
                x: destination.geometry.coordinates[0],
                y: destination.geometry.coordinates[1],
                r: nRad,
                s: speciesId
            }

            if(this.Gcounter<10){
                console.log();
                this.Gcounter++;
            }
            
            if(this.ppIsValid(neighbor, this.bboxWidth, this.bboxHeight, this.cellsize, this.grid, this.points, distance)){

                
                this.points.push(neighbor);
                this.newPoints.push(neighbor);
                //this.printPoint(neighbor.x, neighbor.y, neighbor.r, s); // ADD POINT
                //this.grid[cellX][cellY] = this.points.length;
                //neighborExcepted = true;
                //this.spawnPoints.push(neighbor);


                var distanceX = turf.distance([neighbor.x, neighbor.y], [this.bbox[0], neighbor.y]) * 1000; // minX, minY
                var distanceY = turf.distance([neighbor.x, neighbor.y], [neighbor.x, this.bbox[1]]) * 1000;
                const cellX = Math.round(distanceX/this.cellsize);
                const cellY = Math.round(distanceY/this.cellsize);
                if(this.grid[cellX] === undefined){
                    //throw 'ERROR cellX:'+ cellX +' : ' + this.grid.length;
                    //console.log('ERROR cellX:', cellX, this.grid.length);
                }else if(this.grid[cellX][cellY] === undefined){
                    //throw 'ERROR cellY:'+ cellY +' : ' + this.grid[cellX].length;
                    //console.log('ERROR cellY:', cellY, this.grid[cellX].length);
                }else{
                    this.grid[cellX][cellY] = this.points.length;
                    neighborExcepted = true;
                    this.spawnPoints.push(neighbor);
                    
                }
                break;
            }
        }
        if(!neighborExcepted){
            this.spawnPoints.splice(spawnIndex, 1); // remove from list
        }  
    }
    ppIsValid(neighbor, canvasWidth, canvasHeight, cellSize, grid, points, radius){
        var pt = turf.point([neighbor.x, neighbor.y]);

        if(turf.booleanPointInPolygon(pt, this.basePolygon)){
            
            //const cellX = Math.round((neighbor.x-this.bbox[0])/cellSize);
            //const cellY = Math.round((neighbor.y-this.bbox[1])/cellSize);
            var distanceX = turf.distance([neighbor.x, neighbor.y], [this.bbox[0], neighbor.y]) * 1000;
            //console.log('box: ', distanceX);
            var distanceY = turf.distance([neighbor.x, neighbor.y], [neighbor.x, this.bbox[1]]) * 1000;

            const cellX = Math.round(distanceX/cellSize);
            const cellY = Math.round(distanceY/cellSize);
            
            var searchInRadius = this.maxRadius/cellSize;
            
            
            const searchStartX = Math.max(0, cellX - Math.floor(searchInRadius/2));
            const searchEndX = Math.min(grid.length-1, cellX + Math.ceil(searchInRadius/2));
            const searchStartY = Math.max(0, cellY - Math.floor(searchInRadius/2));
            const searchEndY = Math.min(grid[0].length-1, cellY + Math.ceil(searchInRadius/2));
            
            var hit = true;
            for(let i=searchStartX; i<= searchEndX; i++){
                for(let j=searchStartY; j<= searchEndY; j++){
                    const pointIndex = grid[i][j];
                    if(pointIndex===undefined){
                        console.log('undef');
                        continue;
                    }
                    
                    if(pointIndex){
                        pointIndex =pointIndex-1;
                        
                        var from = turf.point([neighbor.x, neighbor.y]);
                        var to = turf.point([points[pointIndex].x, points[pointIndex].y]);
                        var distance = turf.distance(from, to) * 1000;
                        //console.log('points to: ', distance, radius, points[pointIndex].r);

                        if(distance<Math.max(neighbor.r, points[pointIndex].r)){
                            
                            return false;
                            console.log(' never print');
                        }else{
                            
                            //return false;
                            //console.log('points to: ', distance, radius, points[pointIndex].r);
                        }/*else if(distance>radius*2){
                            console.log('ZU weit weg');
                            return false;
                        }*/
                        //if(distance<24) console.log('NOOO', hit);
                    }
                    //hit = true;
                }
            }
            //if(!hit) console.log(Math.max(radius));
            //return hit;
            return true;
        }
        return false;
        
    }
    treeByProbability(){
        const rand = Math.random();
        let currentPc = 0;

        for(let i in this.treeSpecies){
            currentPc += this.treeSpecies[i].probability;
            
            if(rand<currentPc/100){
                
                return i;
                break;
            }
        }
        /*for(let i=0; i<this.treeSpecies.length; i++){
            currentPc += this.treeSpecies[i].probability;
            if(rand<currentPc/100){
                return i;
                break;
            }
        }*/
    }
    calResult(){
        const pl = this.points.length;
        const border = 1 *100 / pl;
        const tc = document.getElementById('ge-tree-count');
        if(!tc) return;

        

        for(let i=0; i<pl; i++){
            this.treeSpecies[ this.points[i].s ].c += 1 ;
        }
        
        for(let i=0; i<this.treeSpecies.length; i++){
            const res = Math.round(this.treeSpecies[i].c *100 / pl *  100)/100;
            const diff = Math.round((res-this.treeSpecies[ i ].probability) * 100)/100;
            document.getElementById('species-result-' + i).innerHTML = res + ' %';
            document.getElementById('species-diff-' + i).innerHTML = (diff>0 ? '+'+diff : diff) + ' %';
            const tdiff = Math.round(diff/border * 100)/100;
            document.getElementById('species-tdiff-' + i).innerHTML = (tdiff>0 ? '+'+tdiff : tdiff);
            if(Math.abs(diff)>border){
                document.getElementById('species-diff-' + i).classList.remove('text-success');
                document.getElementById('species-diff-' + i).classList.add('text-danger');
            }else{
                document.getElementById('species-diff-' + i).classList.remove('text-danger');
                document.getElementById('species-diff-' + i).classList.add('text-success');
            }
                
            
            this.treeSpecies[ i ].c = 0 ;
        }
        
        tc.innerHTML = 'Tree count: ' + pl;
    }
}