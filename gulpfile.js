var gulp = require('gulp'),
    gulp_concat = require('gulp-concat'),
    gulp_wrap = require('gulp-wrap');

gulp.task('default', function(){
    gulp
        .src(["tools", "tix"].map(function(moduleName){ return [".", "src", [moduleName, "js"].join('.')].join('/'); }))
        .pipe(gulp_concat('tix.js'))
        .pipe(gulp_wrap({ src: './src/wrapper.js'}))
        .pipe(gulp.dest('./dist'));
});

gulp.task('watch', ["default"], function(){
    gulp
        .watch('./src/*.js', ["default"]);
});