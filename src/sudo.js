var onetonine = _.range(1,10);

var squares = _.reduce(onetonine,function(memo,row){
  _.each(onetonine,function(col){
    memo["r"+row+"c"+col]={
      row:"row"+row,
      col:"col"+col,
      id:"r"+row+"c"+col,
      box: "box"+(Math.floor((col-1)/3)+1+Math.floor((row-1)/3)*3),
      canBe: _.reduce(onetonine,function(memo,c){memo[c]=true;return memo;},{}),
      canBeArr: [].concat(onetonine)
    };
  });
  return memo;
},{});

var houses = _.reduce(squares,function(memo,square){
  _.each(["row","col","box"],function(type){
    if(!memo[square[type]]){
      memo[square[type]] = {
        type: type,
        id: square[type],
        squares: [square.id]
      };
    } else {
      memo[square[type]].squares.push(square.id);
    }
  });
  return memo;
},{});

_.map(squares,function(square){
  _.each(["row","col","box"],function(type){
    square[type+"mates"] = _.without(houses[square[type]].squares,square.id);
  });
  square.friends = square.rowmates.concat(square.colmates).concat(square.boxmates);
  return square;
});


var calcHouse = function(house,sqrs){
  return _.extend(house,_.reduce(house.squares,function(memo,sid){
    var square = sqrs[sid];
    if (square.is){
      var c = square.is
      memo.has[c] = sid;
      memo.remaining = _.without(memo.remaining,c);
    } else {
      _.each(square.canBe,function(b,cand){
        if (b){
          memo.placesFor[cand].push(sid);
          _.each(["row","col","box"],function(type){
            if (!memo.housesFor[cand][type].obj[square[type]]){
              //console.log("weeee",house.id,sid,cand,type);
              memo.housesFor[cand][type].obj[square[type]] = true;
              memo.housesFor[cand][type].arr.push(square[type]);
            }
          });
        }
      });
      memo.emptySquares.push(sid);
    }
    return memo;
  },_.extend({
    placesFor:  _.reduce(onetonine,function(memo,c){memo[c]=[];return memo;},{}),
    has: _.reduce(onetonine,function(memo,c){memo[c]=false;return memo;},{}),
    remaining: [].concat(onetonine),
    emptySquares: [],
    housesFor: _.reduce(onetonine,function(memo,c){
      memo[c] = { row:{arr:[],obj:{}}, col:{arr:[],obj:{}}, box:{arr:[],obj:{}} };
      return memo;
    },{})
  })));
};

var calcHouses = function(houses,sqrs){
  return _.reduce(houses,function(memo,house,id){
    memo[id] = calcHouse(house,sqrs);
    return memo;
  },{});
};

var performInstruction = function(action,squares){
  if (action[0]==="set"){
  	squares[action[1]].is = action[2];
  	return performInstructions( settingConsequences(squares[action[1]],action[2]), squares );
  }
  squares[action[1]].canBe[action[2]] = false;
  squares[action[1]].canBeArr = _.without(squares[action[1]].canBeArr,action[2]);
  return squares;
};

var performInstructions = function(actions,squares){
  _.each(actions,function(action){
    squares = performInstruction(action,squares);
  });
  return squares;
};

var settingConsequences = function(square,cand){
  return _.reduce(square.friends,function(memo,oid){
  	return squares[oid].canBe[cand] ? memo.concat([["cantbe",oid,cand]]) : memo;
  },[]);
};

var setupToInstructions = function(setup){
  return _.reduce(setup,function(instr,line,i){
    return instr.concat(_.reduce(line.split(""),function(sets,char,j){
      var cand = +char;
      return sets.concat( cand ? [["set","r"+(i+1)+"c"+(j+1),cand]] : [] );
    },[]));
  },[]);
};

var showInstructions = function(instr){
  return _.reduce(instr,function(memo,i){
  	memo[i[1]] = {cantbe:"removedfrom","set":"solved"}[i[0]];
    return memo;
  },{});
}

var inferSolveInstructions = function(o,squares,houses){
  if (o.square && o.setcand){
  	return [["set",o.square,o.setcand]];
  } else if (o.cleanse && (o.removecand || o.removecands)){
    return _.reduce(o.cleanse,function(memo,sid){
      return memo.concat(_.reduce((o.removecands || []).concat(o.removecand || []),function(m,c){
        return m.concat([["cantbe",sid,o.removecand]]);
      },[]));
    },[]);
  }
  throw "Couldn't infer effect!";
};

var inferSolveHighlights = function(solve){
  var used = {house:1,line:1,row:1,col:1,box:1,line1:1,line2:1,line3:1},
      multi = {poss:1,squares:1};
  var ret = _.reduce(solve,function(memo,val,key){
    if (used[key]){
      memo[val] = "used";
    } else if (multi[key]){
      _.map(val,function(id){
        memo[id] = "used";
      });
    }
    return memo;
  },{});
  return ret;
};

var houseTypeList = function(sids,type){
  var lids = [], used = {};
  _.each(sids,function(sid){
  	var s = sudo.squares[sid];
    if(!used[s[type]]){
      lids.push(s[type]);
      used[s[type]] = true;
    }
  });
  return lids;
};

var techs = {
  justOneCand: {
  	find: function(squares,houses){
  	  for(var sid in squares){
  	  	if (!squares[sid].is && squares[sid].canBeArr.length === 1){
  	  	  return {square:sid,setcand:squares[sid].canBeArr[0]};
  	  	}
  	  }
  	}
  },
  onlyPlace: {
    find: function(squares,houses){
      for(var hid in houses){
      	var house = houses[hid];
        for(var c in onetonine){
          c = onetonine[c];
          if(!house.has[c] && house.placesFor[c].length === 1){
          	return {square:house.placesFor[c][0],house:house.id,setcand:c};
          }
        }
      }  
    }
  },
  lance: {
    find: function(squares,houses){
      for(var i=1;i<=9;i++){
        var box = houses["box"+i];
        for(var n in box.remaining){
          var cand = box.remaining[n];
          for(var t=0;t<=1;t++){
            var type = ["row","col"][t];
            if (box.housesFor[cand][type].arr.length === 1){
              var line = houses[box.housesFor[cand][type].arr[0]];
              var cleanse = _.difference(line.placesFor[cand],box.placesFor[cand]);
              if (cleanse.length){
              	return {
                  box:box.id,type:type,line:line.id,removecand:cand,poss:box.placesFor[cand],cleanse:cleanse
                };
              }
            }
          }
        }
      }
    }
  },
  flag: {
    find: function(squares,houses){
      for(var t=0;t<=1;t++){
        var type = ["row","col"][t];
        for(var n=1;n<=9;n++){
          var line = houses[type+n];
          for(var c=0;c < line.remaining.length;c++){
          	var cand = line.remaining[c];
          	if (line.housesFor[cand].box.arr.length===1){
          	  var box = houses[line.housesFor[cand].box.arr[0]];
          	  var cleanse = _.difference(box.placesFor[cand],line.placesFor[cand]);
          	  if (cleanse.length){
          	  	return {box:box.id,type:type,line:line.id,removecand:cand,poss:line.placesFor[cand],cleanse:cleanse};
          	  }
          	}
          }
        }
      }
    }
  },
  closedgroup: {
  	find: function(squares,houses){
      for(var n=2;n<=2;n++){
      	for(var hid in houses){
      	  var house = houses[hid];
      	  if (house.emptySquares.length>n){
      	  	var from = _.filter(house.emptySquares,function(sid){return squares[sid].canBeArr.length<=n;});
      	  	if (from.length>=n){
	      	  	var combs = Combinatorics.combination(from,n).toArray();
	      	  	for(var c=0;c < combs.length; c++){
	      	  	  var comb = combs[c];
	      	  	  var canbe = _.reduce(comb,function(memo,sid){
	                return _.unique(memo.concat(squares[sid].canBeArr));
	      	  	  },[]);
	      	  	  if (canbe.length && canbe.length<=n && _.filter(canbe,function(c){return house.placesFor[c].length>n;}).length){
	      	  	  	return {house:hid,removecands:canbe,squares:comb,cleanse:_.difference(house.emptySquares,comb)}
	      	  	  }
	      	  	}
	      	}
      	  }
      	}
      }
  	},
  	effect: function(o,squares,houses){
      return _.reduce(o.cleanse,function(memo,sid){
        return _.reduce(o.removecands,function(memo,cand){
          return memo.concat( [["cantbe",sid,cand]] );
        },memo);
      },[])
  	}
  },
  innergroup: {
  	find: function(){
  	  for(var hid in houses){
  	  	var house = houses[hid];
	    var cands = _.filter(house.remaining,function(c){return house.placesFor[c].length >= 1 && house.placesFor[c].length < house.emptySquares.length; });
  	  	if (true || cands.length > 1){
    	  for(var n=2,l=Math.min(cands.length,house.emptySquares.length-1);n<=l;n++){
	  	  	  var combs = Combinatorics.combination(cands,n).toArray();
	  	  	  for(var c=0;c < combs.length; c++){
		        var comb = combs[c];
		        var poss = _.uniq(_.reduce(comb,function(memo,cand){
		          return memo.concat(house.placesFor[cand]);
		      	},[]));
		      	if (poss.length===n){
		      	  var cleanse = _.filter(poss,function(sid){
		      	    return _.difference(squares[sid].canBeArr,comb).length;
		      	  });
		      	  if (cleanse.length){
		      	  	return {house:hid,cleanse:cleanse,keepcands:comb,poss:poss};
		      	  }
		      	}
		      }
		  }
  	  	}
  	  }
  	},
  	effect: function(o,squares,houses){
      return _.reduce(o.cleanse,function(memo,sid){
        var rest = _.difference(squares[sid].canBeArr,o.keepcands);
        return memo.concat(_.map(rest,function(c){
          return ["cantbe",sid,c];
        }));
      },[]);
  	}
  },
  xwing: {
  	find: function(squares,houses){
  	  for(var n=2;n<=3;n++){
  	  for(var t=0;t<=1;t++){
  	  	var type = ["row","col"][t];
  	    for(var cand=1;cand<=9;cand++){
  	      var lids = _.filter(_.map(onetonine,function(i){return type+i;}),function(lid){return !houses[lid].has[cand] && houses[lid].placesFor[cand].length >= 2 && houses[lid].placesFor[cand].length <= n;} );
  	      if (lids.length >=n){
  	        var combs = Combinatorics.combination(lids,n).toArray();
  	        for(var c=0;c<combs.length;c++){
  	          var comb = combs[c];
  	          var otype = {row:"col",col:"row"}[type];
  	          var nodes = _.flatten(_.map(comb,function(lid){return houses[lid].placesFor[cand]})).sort();
  	          var crosslids = sudo.houseTypeList(nodes,otype);
  	          if (crosslids.length===n){
  	          	var others = _.difference(_.uniq(_.flatten(_.map(crosslids,function(clid){return houses[clid].placesFor[cand];}))),nodes);
  	          	if (others.length){
  	              console.log("LIDS",comb,"CROSS",crosslids,"NODES",nodes,"DELFROM",others);
  	          	  return _.extend({type:type,squares:nodes,removecand:cand,cleanse:others},_.reduce(comb,function(m,l,n){
                    m["line"+(n+1)]=l;
                    return m;
  	          	  },{}));
  	          	}
  	          }
  	        }
  	      }
        }
  	  }
  	  }
  	}
  },
};

var sudo = {
  showInstructions: showInstructions,
  setupToInstructions: setupToInstructions,
  squares: squares,
  houses: calcHouses(houses,squares),
  calcHouse: calcHouse,
  calcHouses: calcHouses,
  performInstruction: performInstruction,
  performInstructions: performInstructions,
  settingConsequences: settingConsequences,
  inferSolveInstructions: inferSolveInstructions,
  inferSolveHighlights: inferSolveHighlights,
  houseTypeList: houseTypeList,
  techs: techs,
  sudos: {
  	withxwing: [
       "900861005",
       "087542009",
       "000973002",
       "800004103",
       "061035948",
       "403180007",
       "510007006",
       "000058291",
       "008310004"
      ],
    fromdragon1: [ // challenging, no solve with ->xwing!
      "700000805",
      "000005006",
      "500890703",
      "000051039",
      "000000000",
      "290730000",
      "302067010",
      "900200000",
      "604000002"
    ],
    fromdragon2mod: [ // justonecandable. bah
      "000020190",
      "000000028",
      "502810740",
      "308142650",
      "640080012",
      "019563804",
      "053079201",
      "920000000",
      "067030000"
    ],
    swordfishexample: [
      "801050030",
      "903068000",
      "040003508",
      "600902000",
      "080030040",
      "300501007",
      "502000080",
      "000370009",
      "030020100"
    ]
  }
};