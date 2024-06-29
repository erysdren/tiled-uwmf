//
// UWMF support for Tiled
//
// Copyright (c) 2024 erysdren (it/she/they)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//

const pwadMagic = "PWAD";
const iwadMagic = "IWAD";

function numToUint32(num) {
	arr = new ArrayBuffer(4);
	view = new DataView(arr);
	view.setUint32(0, num, true);
	return arr;
}

function nullPad(str, len) {
	if (str.length >= len)
		return str.substring(0, 7);
	return str + Array(len - str.length + 1).join("\x00");
}

function makeLump(pos, len, name) {
	return numToUint32(pos) + numToUint32(len) + nullPad(name, 8);
}

function keyValuePair(key, value) {
	let res = key + "=";
	switch (typeof(value)) {
		case "string":
			res += "\"" + value + "\";"
			break;
		case "number":
			res += value.toString(10) + ";"
			break;
		case "boolean":
			res += value + ";"
			break;
		default:
			throw new TypeError("keyValuePair(): Unknown type");
			break;
	}
	return res;
}

function uwmfWrite(tileMap, fileName) {

	// no infinite maps
	if (tileMap.infinite) {
		return "Only non-infinite maps are supported";
	}

	// only square tiles are allowed
	if (tileMap.tileWidth != tileMap.tileHeight) {
		return "Only maps with square tiles are supported";
	}

	//
	// create textmap
	//

	let textMap = ""

	// map keyvalues
	textMap += keyValuePair("namespace", "Wolf3D");
	textMap += keyValuePair("name", "MAP01");
	textMap += keyValuePair("tilesize", tileMap.tileWidth);
	textMap += keyValuePair("width", tileMap.width);
	textMap += keyValuePair("height", tileMap.height);

	// plane
	textMap += "plane{";
	textMap += keyValuePair("depth", 64);
	textMap += "}";

	// sector
	textMap += "sector{";
	textMap += keyValuePair("textureceiling", "#383838");
	textMap += keyValuePair("texturefloor", "#707070");
	textMap += "}";

	//
	// create wad
	//

	let wadBuffer = "";

	// add magic
	wadBuffer += pwadMagic;

	// add number of lumps
	wadBuffer += numToUint32(3);

	// add offset to lump table
	wadBuffer += numToUint32(12 + textMap.length);

	// add textmap data
	wadBuffer += textMap;

	// add lumps
	wadBuffer += makeLump(0, 0, "MAP01");
	wadBuffer += makeLump(12, textMap.length, "TEXTMAP");
	wadBuffer += makeLump(0, 0, "ENDMAP");

	// write out file
	let file = new BinaryFile(fileName, BinaryFile.WriteOnly);
	file.write(wadBuffer);
	file.commit()
}

const uwmfFormat = {
	name: "Wolfenstein 3D (UWMF)",
	extension: "wad",
	write: uwmfWrite
};

tiled.registerMapFormat("uwmf", uwmfFormat);
