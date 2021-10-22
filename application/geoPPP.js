import * as turf from '@turf/turf'

export default class GeoPoissonPointProcess{
    constructor(canvasId){
        this.canvas = document.getElementById('ge-canvas-one');
        this.treeSpecies = [
            {probability:10.4, name_en: 'Oak', name_sc:'Quercus', c:0},
            {probability:16.4, name_en: 'Beech', name_sc:'Fagus sylvatica', c:0},
            {probability:17.6, name_en: 'other Broad-leaved species', name_sc:'', c:0},

            {probability:25.4, name_en: 'Spruce', name_sc:'Picea', c:0},
            {probability:2.7, name_en: 'Fir', name_sc:'Abies', c:0},
            {probability:2, name_en: 'Douglas-fir', name_sc:'Pseudotsuga menziesii', c:0},
            {probability:22.7, name_en: 'Pine', name_sc:'Pinus', c:0},
            {probability:2.8, name_en: 'Larch', name_sc:'Larix', c:0},
        ];
        this.initSpecies();
    }
    initSpecies(){
        for(var i = 0; i < this.treeSpecies.length; i++){
            document.getElementById('species-is-' + i).innerHTML = this.treeSpecies[i].probability +  ' %';
        }
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
        this.startCoordinates = startCoordinates;
        //[LON, LAT]
        //LON <- X
        //lat <- y
        this.basePolygon = polygon;
        this.bbox = turf.bbox(polygon); // minX, minY, maxX, maxY 
        this.coordReference = [];

        console.log(this.bbox);
        console.log(startCoordinates);

        this.bboxWidth = this.calDistances([this.bbox[0], this.bbox[1]], [this.bbox[2], this.bbox[1]]);
        this.bboxHeight = this.calDistances([this.bbox[0], this.bbox[1]], [this.bbox[0], this.bbox[3]]);
        
        console.log('bboxWidth: ' + this.bboxWidth); //oben
        console.log('bboxHeight: ' + this.bboxHeight); //oben

        const that = this;
        this.canvas.innerHTML = "";

        this.numSamplesBeforeRejection = 30; // bricht nach 30 Versuchen ab
        this.radius = radius; // Minimale Entfernung zwischen Punkten
        this.cellsize = this.radius / Math.sqrt(2); // Pythagoras
        

        this.grid = []; //width // height

        for(var i=0;i<Math.ceil(this.bboxWidth / this.cellsize);i++){
            const cols = [];
            for(var j=0;j<Math.ceil(this.bboxHeight / this.cellsize);j++){
                cols.push(null);
            }
            this.grid.push(cols);
        }

        this.points = [];
        this.spawnPoints = [];

        this.spawnPoints.push({x:this.startCoordinates[0], y:this.startCoordinates[1], r:200}); // Start

    }
    getAll(){
        this.newPoints = [];

        while(this.spawnPoints.length > 0){
            this.calNewPoints();
        }
        return this.points;
    }
    drawing(){

        this.newPoints = [];

        if(this.spawnPoints.length > 0){
            this.calNewPoints();
        }
        return {newPoints: this.newPoints, spawnPoints: this.spawnPoints.length};
    }
    calNewPoints(){
        const spawnIndex = Math.ceil(Math.random() * (this.spawnPoints.length-1));
        const spawnCenter = this.spawnPoints[spawnIndex];

        let neighborExcepted = false;
        for(let i = 0; i<this.numSamplesBeforeRejection; i++){
            const angle = Math.random() * 360 - 180;
            var pt = turf.point([spawnCenter.x, spawnCenter.y]);
            var distance = (Math.random() * this.radius + this.radius) / 1000;
            var bearing = angle;

            var destination = turf.rhumbDestination(pt, distance, bearing);
            const neighbor = {
                x: destination.geometry.coordinates[0],
                y: destination.geometry.coordinates[1]
            }
            
            if(this.ppIsValid(neighbor, this.bboxWidth, this.bboxHeight, this.cellsize, this.grid, this.points, this.radius)){

                var s = this.treeByProbability();
                neighbor.s = s
                this.points.push(neighbor);
                this.newPoints.push(neighbor);
                this.printPoint(neighbor.x, neighbor.y, neighbor.r, s); // ADD POINT
                this.spawnPoints.push(neighbor);


                var distanceX = turf.distance([neighbor.x, neighbor.y], [this.bbox[0], neighbor.y]) * 1000;
                var distanceY = turf.distance([neighbor.x, neighbor.y], [neighbor.x, this.bbox[1]]) * 1000;
                const cellX = Math.round(distanceX/this.cellsize);
                const cellY = Math.round(distanceY/this.cellsize);
                this.grid[cellX][cellY] = this.points.length;
                


                neighborExcepted = true;
                //break;
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
            var distanceY = turf.distance([neighbor.x, neighbor.y], [neighbor.x, this.bbox[1]]) * 1000;
            const cellX = Math.round(distanceX/cellSize);
            const cellY = Math.round(distanceY/cellSize);

            
            
            const searchStartX = Math.max(0, cellX - 2);
            const searchEndX = Math.min(grid.length-1, cellX + 2);
            const searchStartY = Math.max(0, cellY - 2);
            const searchEndY = Math.min(grid[0].length-1, cellY + 2);
            
            var hit = false;
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

                        if(distance<radius){
                            return false;
                        }/*else if(distance>radius*2){
                            console.log('ZU weit weg');
                            return false;
                        }*/
                    }
                    hit = true;
                }
            }
            return hit;
        }
        
        return false;
    }
    treeByProbability(){
        const rand = Math.random();
        let currentPc = 0;
        for(let i=0; i<this.treeSpecies.length; i++){
            currentPc += this.treeSpecies[i].probability;
            if(rand<currentPc/100){
                return i;
                break;
            }
        }
        console.log(currentPc);
        console.log(rand);
    }
    calResult(){
        const pl = this.points.length;
        const border = 1 *100 / pl;
        const tc = document.getElementById('ge-tree-count');
        if(!tc) return;

        /*for(let i=0; i<this.treeSpecies.length; i++){
            //document.getElementById('species-result-' + i).innerHTML = this.treeSpecies[i].c;
            this.treeSpecies[ i ].c = 0 ;
        }*/

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