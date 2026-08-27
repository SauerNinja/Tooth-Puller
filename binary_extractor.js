var Blast = require('protoblast')(false),
    Be,
    Fn = Blast.Collection.Function,
    fs = require('fs');

/**
 * The BinaryExtractor class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.1
 */
Be = Fn.inherits('Informer', 'Develry', function BinaryExtractor(buffer) {

	// The buffer
	this.buffer = buffer;

	// The current position
	this.index = 0;
});

/**
 * Set the buffer to use
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Buffer}   buffer
 */
Be.setMethod(function setBuffer(buffer) {

	// Set the new buffer to use
	this.buffer = buffer;

	// Reset the index
	this.index = 0;
});

/**
 * Skip some bytes
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Number}
 */
Be.setMethod(function skip(size) {
	this.index += size;
});

/**
 * Go to the position after the given string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 *
 * @param    {String}   str
 *
 * @return   {Number}   The new index, or -1 if not found
 */
Be.setMethod(function after(str) {

	var index,
	    prev,
	    temp;

	if (Array.isArray(str)) {
		str = new Buffer(str);
	}

	index = this.buffer.indexOf(str, this.index);

	if (index == -1) {
		return -1;
	}

	index += str.length;
	this.index = index;

	return index;
});

/**
 * Read string prefixed with the length,
 * like in the Creatures games.
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.2
 *
 * @return   {String}
 */
Be.setMethod(function readLString() {

	var length,
	    string,
	    end;

	// Get the length of the cstring
	length = this.buffer[this.index];

	// Increment the index
	this.index += 1;

	// If the length is 0xFF, we have to read 2 more bytes for the real length
	if (length == 0xFF) {
		length = this.readWord();
	}

	// Calculate the end index
	end = this.index + length;

	// Get the actual string
	string = this.buffer.slice(this.index, end).toString();

	this.index = end;

	return string;
});

/**
 * Read LONG unsigned integer (little endian)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @return   {Number}
 */
Be.setMethod(function readLong() {

	var number;

	// Parse the unsigned 32-bit long little-endian integer
	number = this.buffer.readUInt32LE(this.index);

	// Increase the index by 4
	this.index = this.index + 4;

	return number;
});

/**
 * Read WORD unsigned integer (little endian)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @return   {Number}
 */
Be.setMethod(function readWord() {
	var number;

	// Parse the unsigned 16-bit long little-endian integer
	number = this.buffer.readUInt16LE(this.index);

	// Increase the index by 2
	this.index = this.index + 2;

	return number;
});

/**
 * Read a number of bytes
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Integer}  size
 *
 * @return   {Buffer}
 */
Be.setMethod(function readBytes(size) {

	var result,
	    end;

	// Calculate the ending position
	end = this.index + size;

	// Extract a new piece of buffer
	result = this.buffer.slice(this.index, end);

	// Set the new index
	this.index = end;

	return result;
});

/**
 * Read a single byte
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @return   {Number}
 */
Be.setMethod(function readByte() {

	var result;

	// Get the byte
	result = this.buffer[this.index];

	// Increment the index
	this.index++;

	return result;
});

module.exports = Be;