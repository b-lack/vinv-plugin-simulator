import * as turf from '@turf/turf'

export default class PoissonPointProcess{

    // BOTTOM < LEFT
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
    poisson3(polygon, startCoordinates ,canvasWidth, canvasHeight, width, height){
        

        const that = this;
        this.canvas.innerHTML = "";

        this.numSamplesBeforeRejection = 30; // bricht nach 30 Versuchen ab
        this.radius = 2.9; // Minimale Entfernung zwischen Punkten
        this.radius = 10;
        this.cellsize = this.radius / Math.sqrt(2); // Pythagoras
        

        this.grid = []; //width // height

        for(var i=0;i<Math.ceil(canvasWidth / this.cellsize);i++){
            const cols = [];
            for(var j=0;j<Math.ceil(canvasHeight / this.cellsize);j++){
                cols.push(undefined);
            }
            this.grid.push(cols);
        }

        this.points = [];
        this.spawnPoints = [];
        this.newPoints = [];
        
        this.spawnPoints.push({x:canvasWidth/2, y:canvasHeight/2, r:200}); // Start
        
        
        
    }
    drawing(canvasWidth, canvasHeight, width, height){
        
        if(this.spawnPoints.length > 0){
            const spawnIndex = Math.ceil(Math.random() * (this.spawnPoints.length-1));
            const spawnCenter = this.spawnPoints[spawnIndex];

            let neighborExcepted = false;
            for(let i = 0; i<this.numSamplesBeforeRejection; i++){
                const angle = Math.random() * Math.PI * 2;
                
                let dir = {
                    x: Math.sin(angle),
                    y: Math.cos(angle),
                    r: this.radius
                };

                const newRadius = Math.round(Math.random()) == 0 ? 20 : 100;
                var maxR = Math.max(spawnCenter.r, newRadius);
                
                const neighbor = {
                    x: spawnCenter.x + dir.x * (Math.random() * this.radius + this.radius),
                    y: spawnCenter.y + dir.y * (Math.random() * this.radius + this.radius),
                    r: this.radius
                }
                
                if(this.ppIsValid(neighbor, canvasWidth, canvasHeight, this.cellsize, this.grid, this.points, this.radius)){
                    var s = this.treeByProbability();
                    neighbor.s = s
                    this.points.push(neighbor);
                    this.newPoints.push(neighbor);
                    this.printPoint(neighbor.x, neighbor.y, neighbor.r, s); // ADD POINT
                    this.spawnPoints.push(neighbor);
                    this.grid[Math.floor(neighbor.x/this.cellsize)][Math.floor(neighbor.y/this.cellsize)] = this.points.length;
                    neighborExcepted = true;
                    //break;
                }
            }
            if(!neighborExcepted){
                this.spawnPoints.splice(spawnIndex, 1); // remove from list
            }
            return true;
        }else{
            return false;
        }
    }
    ppIsValid(neighbor, canvasWidth, canvasHeight, cellSize, grid, points, radius){
        var a = canvasWidth/2 - neighbor.x;
        var b = canvasHeight/2 - neighbor.y;

        var c = Math.sqrt( a*a + b*b );
        if(c<200){
        //if(neighbor.x >=canvasWidth/2-width/2 && neighbor.x < canvasWidth/2+width/2 && neighbor.y >=canvasHeight/2-height/2 && neighbor.y < canvasHeight/2+height/2){
            
            const cellX = Math.round(neighbor.x/cellSize);
            const cellY = Math.round(neighbor.y/cellSize);
            const searchStartX = Math.max(0, cellX - 2);
            const searchEndX = Math.min(grid.length-1, cellX + 2);
            const searchStartY = Math.max(0, cellY - 2);
            const searchEndY = Math.min(grid[0].length-1, cellY + 2);

            
            for(let i=searchStartX; i<= searchEndX; i++){
                for(let j=searchStartY; j<= searchEndY; j++){
                    const pointIndex = grid[i][j];
                    if(pointIndex){
                        pointIndex =pointIndex-1;
                        var x  = neighbor.x - points[pointIndex].x;
                        var y  = neighbor.y - points[pointIndex].y;
                        var dst = Math.sqrt(x * x + y * y);
                        
                        if(dst<radius){
                            return false;
                        }
                    }
                }
            }
            return true;
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