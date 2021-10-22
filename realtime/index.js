import OlMap from './map';


const map = new OlMap();

document.getElementById('tree-selection').addEventListener('change', map.changeTree);
document.getElementById('refreshbtn').addEventListener('click', (_)=>map.refresh());

function rFact(num)
{
    if (num === 0)
      { return 1; }
    else
      { return num * rFact( num - 1 ); }
}


