let numberRE : string = "([0-9]*[.])?[0-9]+([eE][+\\-]?[0-9]+)?";

type unitExp = number[];
let unitNames : string[] = ["m","s","kg","K", "x", "y", "z", "A", "t"];

export class unitValue {
	public value : number;
	public units : unitExp;
	constructor(value: number, units: unitExp) {
		this.value = value;
		this.units = units;
	}
	public pow(p : number) {
		this.units = this.units.map(function(v:number) { return v*p; });
		this.value = Math.pow(this.value, p);
	}
	public mult(other : unitValue) {
		this.units = this.units.map(function(v:number,i:number) { return v + other.units[i]; });
		this.value = this.value * other.value;
	}
	public clone() : unitValue {
		return new unitValue(this.value, this.units);
	}
}

export class unitSet {
	private unitTable : {[key: string] : unitValue } = {};
	public one : unitValue;
	public value(val : number) {
		let units : unitExp = unitNames.map(function(j) { return 0; });
		return new unitValue(val, units)
	}
	constructor() {
		for (let i of unitNames) {
			let units : unitExp = unitNames.map(function(j) { return 0; });
			units = unitNames.map(function(j) { if (i == j) return 1; return 0; });
			this.unitTable[i] = new unitValue(1,units);
		}
		this.one = this.value(1);
		this.unitTable["N"]  = this.readText("1kgm/s2")!;
		this.unitTable["Pa"] = this.readText("1N/m2")!;
		this.unitTable["J"]  = this.readText("1Nm")!;
		this.unitTable["W"]  = this.readText("1J/s")!;
		this.unitTable["V"]  = this.readText("1kgm2/t3/A")!;
		this.unitTable["C"]  = this.readText("1tA")!;
		this.unitTable["nm"] = this.readText("1e-9m")!; 
		this.unitTable["um"] = this.readText("1e-6m")!;
		this.unitTable["mm"] = this.readText("1e-3m")!;
		this.unitTable["cm"] = this.readText("1e-2m")!;
		this.unitTable["km"] = this.readText("1e+3m")!;
		this.unitTable["h"]  = this.readText("3600s")!;
		this.unitTable["ns"] = this.readText("1e-9s")!;
		this.unitTable["us"] = this.readText("1e-6s")!;
		this.unitTable["ms"] = this.readText("1e-3s")!;
		this.unitTable["g"]  = this.readText("1e-3kg")!;
		this.unitTable["mg"] = this.readText("1e-6kg")!;
		this.unitTable["d"]  = this.value(Math.atan(1.0)*4.0/180.)!;
		this.unitTable["%"]  = this.value(1./100.)!;
		this.unitTable["An"] = this.value(6.022*100000000000000000000000.)!;
	}
	public readText(x : string) : unitValue | null {
		let unitRE : string = "(" + Object.keys(this.unitTable).reduce(function(x: string, y: string) : string { return(x + "|" + y)}) + ")";
		let unitPowerRE : string = unitRE + "[0-9]*";
		let numberUnitsRE: string = "^(" + numberRE + ")((" + unitPowerRE + ")*)(/((" + unitPowerRE + ")+))?$";
		let ret : unitValue = this.value(1);
		console.log(JSON.stringify(x));
		let match = RegExp(numberUnitsRE).exec(x);
		if (match) {
			let valS : string | null = match[1];
			console.log(JSON.stringify(match));
			if (valS) {
				ret = this.value(parseFloat(valS));
			}
			let units1S : string | null = match[4];
			let units2S : string | null = match[8];
			if (units1S) {
				let regexp = RegExp(unitRE+"([0-9]*)","g");
				while ((match = regexp.exec(units1S)) !== null) {
					let unitval : unitValue = this.unitTable[match[1]].clone();
					let pow : number = 1;
					console.log(JSON.stringify(match));
					if (match[2]) pow = parseInt(match[2]);
					unitval.pow(pow);
					ret.mult(unitval);
				}
			}
			if(units2S) {
				let regexp = RegExp(unitRE+"([0-9]*)","g");
				while ((match = regexp.exec(units2S)) !== null) {
					let unitval : unitValue = this.unitTable[match[1]].clone();
					let pow : number = 1;
					console.log(JSON.stringify(match));
					if (match[2]) pow = parseInt(match[2]);
					unitval.pow(-pow);
					ret.mult(unitval);
				}
			}
			return ret;
		} else {
			return null;
		}
	}
}

export class unitGauge {
	public unitScales : (number | null) [];
	public solved : boolean;
	public singular : boolean;
	private gauges : unitValue[] = [];
	constructor() {
		this.solved = false;
		this.singular = false;
		this.unitScales = unitNames.map(function(x) { return 0; });
	}
	public add(x : unitValue, y : unitValue) {
		let z = x.clone();
		z.pow(-1);
		z.mult(y);
		this.gauges.push(z);
	}
	public solve() {
		this.solved = true;
		let rhs : number[] = [];
		let mat : unitExp[] = [];
		for (let z of this.gauges) {
			rhs.push(Math.log(z.value));
			mat.push(z.units);
		}
		console.log(JSON.stringify(mat));
		if (rhs.length == 0) return "solved";
		for (let i = 0; i < mat.length; i++) {
			let j : number;
			for (j = 0; j < mat[i].length; j++) {
				if (mat[i][j] != 0) break;
			}
			if (j == mat[i].length) { this.singular = true; return; }
			for (let k = 0; k < mat.length; k++) if (k != i) {
				let ratio = mat[k][j] / mat[i][j];
				rhs[k] = rhs[k] - ratio * rhs[i];
				for (let p = 0; p < mat[i].length; p++) {
					mat[k][p] = mat[k][p] - ratio * mat[i][p];
				}
			}
		}
		console.log(JSON.stringify(mat));
		this.unitScales = unitNames.map(function(x) { return null; });
		for (let i = 0; i < mat.length; i++) {
			let j : number;
			for (j = 0; j < mat[i].length; j++) {
				if (mat[i][j] != 0) break;
			}
			if (j == mat[i].length) { this.singular = true; return; }
			this.unitScales[j] = rhs[i] / mat[i][j];
			for (j = j+1; j < mat[i].length; j++) {
				if (mat[i][j] != 0) { this.singular = true; return; }
			}
		}
		return;
	}
	public unitless(x : unitValue | null) : {value: number, resolved: boolean} | null {
		if (!x) return null;
		if (! this.solved) this.solve();
		if (this.singular) return null;
		let u : number = 0;
		let res : boolean = true;
		for (let j = 0; j < x.units.length; j++) {
			if (x.units[j] != 0) {
				let us : number | null = this.unitScales[j];
				if (us) {
					u = u + x.units[j] * us;
				} else {
					res = false
				}
			}
		}
		return { value: x.value * Math.exp(-u), resolved: res };
	}
}