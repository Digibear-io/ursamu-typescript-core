// mushcode Grammar
// Author: Lemuel Canady, Jr (digibeario@gmail.com)
// This grammar is really basic, but it gets the job done!
// Builds an AST to be processed by the game server.

 
function =  _ call: word "(" _ a: (args)? _ ")" _  
{ 
	const loc = location()
    return {
    	type: "function", 
        operator: {type: "word", value:call},
        location: loc,
        args: Array.isArray(a) ? a : [a]
   	}
} /

_ "[" _ call: word "(" _ a: (args)? _ ")" _ "]" _  
{ 
	const loc = location()
    return {
    	type: "function", 
        operator: {type: "word", value:call},
        location: loc,
        args: Array.isArray(a) ? a : [a]
   	}
}


args = 	a:(arg arg)+ _ t:args* {return [{type: "list", list: a.flat()},...t].flat()}/ 

		a: arg* _ "," _ "," _ t: (args)* 
{ 
	const loc = location();
	return 	[[a,{type: "word", value: null, location: loc}].flat(),t.flat()].flat() 

}/
    
    	a: arg* _ "," _ t: (args)* {return [a.flat(),t.flat()].flat()}  / 
		arg 



arg = 	f: function {return f} / 
				w: word { 
     			const loc = location();
     			return {type: "word", value: w,   location: loc } 
				}


word = w:[^\(\),\[\]]+ {return w.join("").trim()} 
_ = [ \t\n\r]*
