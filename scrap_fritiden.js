
var request = require("request");
var cheerio = require('cheerio');
var Joi = require('joi');

var productSchema = Joi.object().keys({
	title: Joi.string().min(10),
	beds: [Joi.number(), Joi.string()],
	region: Joi.string().min(3),
	city: Joi.string().min(3),
	images: Joi.array()
})

var scrapFritiden = {
	waitTime : 2, // number of seconds afte which second url will start
	validScrapData : [],
	invalidScrapData : [],
	getHtml : function ( url, callback ){
		request(url, function (error, response, body) {
			if (!error) {
				callback('success',body);
			} else {
				callback('error',body)
			}
		});
	},
	getPageInfo : function ( url, callback ){
		this.getHtml( url, function(status ,body){
			if( status === 'error'){

			}else{
				$ = cheerio.load(body);
				var title = beds = region = city = description = '';
				var images = [];
				title = $('h1').text();

				// start bed
				$("td").each(function(index,value ){
					var tdText = $(value).text();
					if( tdText.indexOf('Antal b') !== -1 ){
						var explode = tdText.split(":");
						if( typeof explode[1] != 'undefined' ){
							beds = explode[1].trim();
						}
					}
					
				})
				// end bed

				// start images
				$('a').each(function(index, value){
					if( $(value).attr('href').indexOf('bilder.php') !== -1 ){
						var image = 'http://www.fritiden.se' + $(value).find('img').attr('src');
						images.push(image)
					}
				})
				// end images

				// start region and city
				var locs = [];
				$('span[itemprop="title"]').each(function( index, value ){
					var a = $( value ).text();
					locs.push(a);
				})
				if( typeof locs[3] != 'undefined' ){
					city = locs[3];
				}
				if( typeof locs[2] != 'undefined' ){
					region = locs[2];
				}
				// end region and city

				var row = {
					title : title,
					beds : beds,
					images : images,
					region : region,
					city : city
				}

				callback( row );
			}
		})
	},
	startScrap : function ( urls, callback ){
		var currentThis = this;
		if( urls.length === 0 ){
			callback( {
				validScrapData: currentThis.validScrapData,
				invalidScrapData: currentThis.invalidScrapData,
			});
		}else{
			urlToProcess = urls[0];
	    urls.shift();
	    this.getPageInfo( urlToProcess, function( pageScrapData ){
	    	// start validate data
	    	if( typeof pageScrapData.title != 'undefined' ){
					Joi.validate( pageScrapData, productSchema, function( err, value ){
	    			if( err ){
	    				currentThis.invalidScrapData.push( pageScrapData );	
	    			}else{
	    				currentThis.validScrapData.push( pageScrapData );	
	    			}
	    		})
	    	}
	    	// end validate date	    	
	    	setTimeout( function() {
	    		currentThis.startScrap( urls, callback )
	    	}, currentThis.waitTime * 1000);
	    })
		}
	}
}

// executing script
var urls = [
	"http://www.fritiden.se/objekt-uthyres/14539",
	"http://www.fritiden.se/objekt-uthyres/2771/",
	"http://www.fritiden.se/objekt-uthyres/5358/",
	"http://www.fritiden.se/objekt-uthyres/14579/",
	"http://www.fritiden.se/objekt-uthyres/14775/",
	"http://www.fritiden.se/objekt-uthyres/14174/",
	"http://www.fritiden.se/objekt-uthyres/8674/",
	"http://www.fritiden.se/objekt-uthyres/15031/",
];

scrapFritiden.startScrap( urls, function( output ){
	console.log( output )
})
