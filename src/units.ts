
//type unitExp = [number,number,number,number,number,number,number];

import * as math from math;


type unitExp = number[];

export class unitValue {
	public value : number = 0;
	public units : unitExp = [0,0,0,0,0,0,0];
	constructor(value: number, units: unitExp) {
		this.value = value;
		this.units = units;
	}

}

let unitTable : {[key: string] : unitValue } = {
	'mm': new unitValue( 1e-3, [ 1,  0, 0, 0, 0, 0, 0 ] ),
	'cm': new unitValue( 1e-2, [ 1,  0, 0, 0, 0, 0, 0 ] ),
	'ms': new unitValue( 1e-3, [ 0,  1, 0, 0, 0, 0, 0 ] ),
	'mg': new unitValue( 1e-6, [ 0,  0, 1, 0, 0, 0, 0 ] ),
	 'm': new unitValue( 1,    [ 1,  0, 0, 0, 0, 0, 0 ] ),
	'km': new unitValue( 1e3,  [ 1,  0, 0, 0, 0, 0, 0 ] ),
	 's': new unitValue( 1,    [ 0,  1, 0, 0, 0, 0, 0 ] ),
	'kg': new unitValue( 1,    [ 0,  0, 1, 0, 0, 0, 0 ] ),
	 'g': new unitValue( 1e-3, [ 0,  0, 1, 0, 0, 0, 0 ] ),
	'Pa': new unitValue( 1,    [-1, -2, 1, 0, 0, 0, 0 ] ),
	 'N': new unitValue( 1,    [ 1, -2, 1, 0, 0, 0, 0 ] ),
	 'J': new unitValue( 1,    [ 2, -2, 1, 0, 0, 0, 0 ] ),
	 'K': new unitValue( 1,    [ 0,  0, 0, 1, 0, 0, 0 ] ),
	 'x': new unitValue( 1,    [ 0,  0, 0, 0, 1, 0, 0 ] ),
	 'y': new unitValue( 1,    [ 0,  0, 0, 0, 0, 1, 0 ] ),
	 'z': new unitValue( 1,    [ 0,  0, 0, 0, 0, 0, 1 ] )
};

let numberRE : string = "([0-9]*.)?[0-9]+([eE][-+]?[0-9]+)?";
let unitRE : string = "(" + Object.keys(unitTable).reduce(function(x: string, y: string) : string { return(x + "|" + y)}) + ")";
let unitPowerRE : string = unitRE + "([0-9]*)";
let unitsRE : string = "(" + unitPowerRE + ")*(/((" + unitPowerRE + ")+))?";
let numberUnitsRE: string = "(" + numberRE + ")" + unitsRE;

console.log(numberUnitsRE);

function pr(x : string) {
    let regexp = RegExp(numberUnitsRE);
    let match = regexp.exec(x);
    console.log(JSON.stringify([match[0], match[1], match[4],match[8]));
}
pr("12.12e5ms2/kgms")
pr("12e5ms2/kgms")
pr("12.12ms2/kgms")
pr("12.12e5m/kgms")
pr("12.12e5m2s2kg5/kg1m2s3")
pr("12.12e5ms2")
pr("12.12e5/s")

let unitScale : unitExp = [ 0, 0, 0, 0, 0, 0, 0 ];

function getUnitless( x : unitValue ) : number {
	let val: number = 0;
	for (let i : number = 0; i < x.units.length; i++) {
		val = val + x.units[i] * unitScale[i];
	}
	val = Math.exp(-val) * x.value;
	return val;
}

function getUnitlessS( x : unitValue ) : string {
	return getUnitless(x).toExponential(3);
}

function parseUnit(text : string) {
	let regexp : RegExp = /^([-+]?[0-9]*(\.[0-9]*)?([eE][+-]?[0-9]*)?)([^-+]*)([+-].*)?$/;
	let match : RegExpExecArray | null = regexp.exec(text);
	console.log(match);
	let val : number;
	let unit : string;
	val = parseFloat(match[1]);
	let full : unitValue = new unitValue( val, [ 0,  0, 0, 0, 0, 0, 0 ] );
	unit = match[4];
	t = unit;
	w = "";
	mp = 1;
	er = "";
	while (t != "") {
	 a = unitRegExp.exec(t);
	 if (a == undefined) break;
	 s = a[1];
	 if (s == "/") {
	  if (mp < 0) break;
	  if (a[2] != "") break;
	  mp = -1;
	  if (w == "") {
		  w = "<sup>1</sup>&frasl;<sub>"
	  } else {
		  w = "<sup>" + w + "</sup>&frasl;<sub>"
	  }
	 } else {
	  p = 1;
	  u = a[1];
	  w = w + a[1];
	  if (a[2] != "") { 
	   p = parseInt(a[2]);
	   w = w + "<sup>" + p + "</sup>";
	  }
	  u = unitTable[u];
	  p = p * mp;
	  full.value = full.value * Math.pow(u.value,p);
	  full.unit = numeric.add(full.unit, numeric.mul(u.unit,p));
	 }
	 t = a[3];
	}
	if (mp < 0) w = w + "</sub>";
	if (t != "") {
		w = w + '<span style="color:red">' + t + '</span>';
		full.value = NaN;
		return { value: full, text: text, html: val + " " + w };
	} else {
		return { value: full, text: text, html: val + " " + w };
	}
}
