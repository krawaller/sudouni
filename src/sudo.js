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
      memo.has[square.is] = sid;
      memo.remaining = _.without(memo.remaining,square.is);
    } else {
      _.each(square.canBe,function(b,cand){
        if (b){
          memo.placesFor[cand].push(sid);
        }
      });
      memo.emptySquares.push(sid);
    }
    return memo;
  },{
    placesFor:  _.reduce(onetonine,function(memo,c){memo[c]=[];return memo;},{}),
    has: _.reduce(onetonine,function(memo,c){memo[c]=false;return memo;},{}),
    remaining: [].concat(onetonine),
    emptySquares: []
  }));
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
  if (!squares[action[1]]){console.log("WARNING WARNING",action);}
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

var techs = {
  justOneCand: {
  	find: function(squares,houses){
  	  for(var sid in squares){
  	  	if (!squares[sid].is && squares[sid].canBeArr.length === 1){
  	  	  return {square:sid,candidate:squares[sid].canBeArr[0]};
  	  	}
  	  }
  	},
  	effect: function(o,squares,houses){
  	  return [["set",o.square,o.candidate]];
  	},
  	show: function(o){
  	  return _.object([o.square],[true]);
  	}
  },
  onlyPlace: {
    find: function(squares,houses){
      for(var hid in houses){
      	var house = houses[hid];
        for(var c in onetonine){
          c = onetonine[c];
          if(!house.has[c] && house.placesFor[c].length === 1){
          	return {square:house.placesFor[c][0],type:house.type,candidate:c};
          }
        }
      }  
    },
    effect: function(o,squares,houses){
      return [["set",o.square,o.candidate]];
    },
    options: {
      square: {},
      candidate: {
        type: "candidate",
        dependson: "square",
        foundin: "square",
        single: true
      },
      type: {
      	dependson: "square",
      	validate: function(o){
          
      	}
      }
    },
    show: function(o,squares,houses){
      return _.object([o.square,squares[o.square][o.type]],[true,true]);
    }
  },
  lance: {
    find: function(squares,houses){
      for(var i=1;i<=9;i++){
        var box = houses["box"+i];
        for(var n in box.remaining){
          var cand = box.remaining[n];
          if (box.placesFor[cand].length <= 3){
            var poss = _.reduce(box.placesFor[cand],function(memo,sid){
              var s = squares[sid];
              if (!memo[s.row]){
                memo[s.row]=true;
                memo.rows.push(s.row);
              }
              if (!memo[s.col]){
                memo[s.col]=true;
                memo.cols.push(s.col);
              }
              return memo;
            },{rows:[],cols:[],used:{}});
            if (poss.rows.length === 1){
              var r = houses[poss.rows[0]];
              if (r.placesFor[cand].length > box.placesFor[cand].length){
                return {
                  box:box.id,type:"row",line:r.id,candidate:cand,cleanse:_.difference(r.placesFor[cand],box.placesFor[cand])
                };
              }
            }
            if (poss.cols.length === 1){
              var r = houses[poss.cols[0]];
              if (r.placesFor[cand].length > box.placesFor[cand].length){
                return {
                  box:box.id,type:"col",line:r.id,candidate:cand,cleanse:_.difference(r.placesFor[cand],box.placesFor[cand])
                };
              }
            }
          }
        }
      }
    },
    effect: function(o,squares,houses){
      return _.map(o.cleanse,function(sid){
      	return ["cantbe",sid,o.candidate];
      });
    },
    show: function(o,squares,houses){
      return _.extend(_.object([o.box,o.line],[true,true]),_.reduce(o.cleanse,function(memo,sid){
        memo[sid] = true;
        return memo;
      },{}));
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
	      	  	  	//console.log("SO WE FOUND?!",comb,_.difference(house.emptySquares,comb),canbe)
	      	  	  	return {house:hid,candidates:canbe,squares:comb,others:_.difference(house.emptySquares,comb)}
	      	  	  }
	      	  	}
	      	}
      	  }
      	}
      }
  	},
  	effect: function(o,squares,houses){
      return _.reduce(o.others,function(memo,sid){
        return _.reduce(o.candidates,function(memo,cand){
          return memo.concat( [["cantbe",sid,cand]] );
        },memo);
      },[])
  	},
  	show: function(o,squares,houses){
  	  return _.extend(_.object([o.house],[true]),_.reduce(o.others,function(memo,sid){
  	  	memo[sid] = true;
  	  	return memo;
  	  },{}));
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
		      	  	return {house:hid,cleanse:cleanse,keepcands:comb,squares:poss};
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
  	},
  	show: function(o,squares,houses){
  	  return _.extend(_.object([o.house],[true]),_.reduce(o.cleanse,function(memo,sid){
  	  	memo[sid] = true;
  	  	return memo;
  	  },{}));
  	}
  },
  xwing: {
  	find: function(squares,houses){
  	  for(var t=0;t<=1;t++){
  	  	var type = ["row","col"][t];
  	    for(var cand=1;cand<=9;cand++){
  	      var lids = _.filter(_.map(onetonine,function(i){return type+i;}),function(lid){return !houses[lid].has[cand] && houses[lid].placesFor[cand].length === 2;} );
  	      if (lids.length >=2){
  	        var combs = Combinatorics.combination(lids,2).toArray();
  	        for(var c=0;c<combs.length;c++){
  	          var comb = combs[c];
  	          var first = houses[comb[0]].placesFor[cand].sort();
  	          var second = houses[comb[1]].placesFor[cand].sort();
  	          var otype = {row:"col",col:"row"}[type];
  	          if (squares[first[0]][otype] === squares[second[0]][otype] && squares[first[1]][otype] === squares[second[1]][otype]){
  	            var others = _.difference(houses[squares[first[0]][otype]].placesFor[cand].concat(houses[squares[first[1]][otype]].placesFor[cand]),first.concat(second));
  	            if (others.length){
  	              return {line1:comb[0],line2:comb[1],type:type,corners:first.concat(second),cleanse:others,candidate:cand};
  	            }
  	          }
  	        }
  	      }
        }
  	  }
  	},
  	effect: function(o,squares,houses){
  	  return _.map(o.cleanse,function(sid){
        return ["cantbe",sid,o.candidate];
  	  });
  	},
  	show: function(o,squares,houses){
  	  return _.extend(_.object([o.line1,o.line2],[true,true]),_.reduce(o.cleanse.concat(o.corners),function(memo,sid){
  	  	memo[sid] = true;
  	  	return memo;
  	  },{}));
  	}
  }
};

var sudo = {
  setupToInstructions: setupToInstructions,
  squares: squares,
  houses: calcHouses(houses,squares),
  calcHouse: calcHouse,
  calcHouses: calcHouses,
  performInstruction: performInstruction,
  performInstructions: performInstructions,
  settingConsequences: settingConsequences,
  techs: techs
};