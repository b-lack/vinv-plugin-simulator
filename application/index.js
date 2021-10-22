import OlMap from './map';


const map = new OlMap();



function rFact(num)
{
    if (num === 0)
      { return 1; }
    else
      { return num * rFact( num - 1 ); }
}


