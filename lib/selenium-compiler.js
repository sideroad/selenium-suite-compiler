'use strict';

var wrench = require('wrench'),
    jsdom = require('jsdom'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),
    _ = require('underscore'),
    async = require('async');

exports.compile = function( opts ){
  var src = opts.get('src'),
      dist = opts.get('dist'),
      suffix = opts.get('suffix') || 'suite',
      jquery = fs.readFileSync( path.join( __dirname, 'jquery-1.9.1.min.js' ), 'utf8').toString(),
      pattern = new RegExp("\\."+suffix, "g"),
      head = '<?xml version="1.0" encoding="UTF-8"?>'+
             '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'+
             '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">'+
             '<head>'+
             '  <meta content="text/html; charset=UTF-8" http-equiv="content-type" />'+
             '  <title>Test Suite</title>'+
             '</head>'+
             '<body>'+
             '<table id="suiteTable" cellpadding="1" cellspacing="1" border="1" class="selenium"><tbody>'+
             '<tr><td><b>Test Suite</b></td></tr>',
      foot = '</tbody></table>'+
             '</body>'+
             '</html>';

  wrench.readdirRecursive(src, function(error, files) {
    _.chain(files).filter(function( file ){
      return pattern.test( file );
    }).each(function(file){
      var results = [];
      jsdom.env({
        html: path.join( src, file ),
        src: [jquery],
        done: function(errors, window){
          var $ = window.$,
              hrefs = [];

          $('a[href]').each(function(){
            hrefs.push(this.href);
          });
          async.map( hrefs, function( href, callback ){
            jsdom.env({
              html: fs.readFileSync( href, 'utf8').toString(),
              src: [jquery],
              done: function(errors, window){
                var $ = window.$;
                callback( null, $('tbody').html() );
              }
            });
          }, function( err, results ){
            fs.writeFileSync( dist, head + results.join('') + foot, 'utf8' );
          });
        }
      });
    });
  });
};
