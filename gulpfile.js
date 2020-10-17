
const { series, src, dest } = require("gulp");
const fs = require("fs");
const uglify_es = require("gulp-uglify-es").default;
const rename = require("gulp-rename");
const header = require('gulp-header');


function uglify(cb) {
    return src("abecs.js")
        .pipe(rename("abecs.min.js"))
        .pipe(uglify_es())
        .pipe(dest("."));
}

function addCopyright(cb) {
    return src("abecs.min.js")
        .pipe(header(copyright))
        .pipe(dest("."));
}

function copyBitVec(cb) {
    const NODE_MODULES_SRC = "node_modules/bitvec/";
    const PARENT_DIR_SRC = "../bitvec/";
    let src_dir = "";

    if (fs.existsSync(NODE_MODULES_SRC))
        src_dir = NODE_MODULES_SRC;
    else if (fs.existsSync(PARENT_DIR_SRC))
        src_dir = PARENT_DIR_SRC;
    else
        throw Error("BitVec source folder not found.");
    return src(src_dir + "/bitvec.js")
        .pipe(dest("./src/lib/"));
}

let copyright = [
    "// Abecs.js - Array-based entity component system.",
    "// Copyright (C) 2020 William Wong (williamw520@gmail.com).  All rights reserved.",
    "",
].join("\n");

exports.setuplib = series(copyBitVec);
exports.default = series(uglify, addCopyright);

