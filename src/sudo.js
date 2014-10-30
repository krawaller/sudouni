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
  square.linemates = square.rowmates.concat(square.colmates);
  square.linecousins = _.filter(square.linemates,function(sid){return squares[sid].box !== square.box;});
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
    return _.reduce([].concat(o.cleanse),function(memo,sid){
      return memo.concat(_.reduce((o.removecands || []).concat(o.removecand || []),function(m,c){
        return m.concat([["cantbe",sid,c]]);
      },[]));
    },[]);
  } else if (o.setsquares && o.setcand){
  	return _.map(o.setsquares,function(sid){
  	  return ["set",sid,o.setcand];
  	});
  }
  throw "Couldn't infer effect!";
};

var inferSolveHighlights = function(solve){
  var used = {house:1,line:1,row:1,col:1,box:1,line1:1,line2:1,line3:1,othersquare:1},
      multi = {poss:1,squares:1,lines:1,othersquares:1,houses:1};
  var ret = _.reduce(solve,function(memo,val,key){
    if (used[key]){
      memo[val] = key==="othersquare"?"odd":"used";
    } else if (multi[key]){
      _.map(val,function(id){
        memo[id] = (key==="othersquares"?"odd":"used");
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

var commonHouses = function(sid1,sid2){
  var s1 = squares[sid1], s2 = squares[sid2], ret = [];
  if (s1.row===s2.row){ret.push(s1.row);}
  if (s1.col===s2.col){ret.push(s1.col);}
  if (s1.box===s2.box){ret.push(s1.box);}
  return ret;
}

var techs = {
  justOneCand: {
  	find: function(squares,houses){
  	  for(var sid in squares){
  	  	if (!squares[sid].is && squares[sid].canBeArr.length === 1){
  	  	  return {square:sid,setcand:squares[sid].canBeArr[0]};
  	  	}
  	  }
  	},
  	describe:function(o,squares,houses){
  	  return ["The only possibility in",{sid:o.square,c:"solved"},"is",{cand:o.setcand}];
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
    },
    describe:function(o,squares,houses){
  	  return ["The only place for",{cand:o.setcand},"in",{hid:o.house},"is",{sid:o.square,c:"solved"}];
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
    },
    describe:function(o,squares,houses){
      return ["As all possibilities for",{cand:o.removecand},"in",{hid:o.box},"are found in",{hid:o.line},"it can't be elsewhere in the line such as in",{sids:o.cleanse,c:"removedfrom"}];
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
    },
    describe:function(o,squares,houses){
      return ["As all possibilities for",{cand:o.removecand},"in",{hid:o.line},"are found in",{hid:o.box},"it can't be elsewhere in the box such as in",{sids:cleanse,c:"removedfrom"}]
    }
  },
  closedgroup: {
  	find: function(squares,houses){
      for(var n=2;n<=4;n++){
      	for(var hid in houses){
      	  var house = houses[hid];
      	  if (house.emptySquares.length>n){
      	  	var from = _.filter(house.emptySquares,function(sid){return squares[sid].canBeArr.length<=n;});
      	  	if (from.length>=n){
	      	  	var combs = Combinatorics.combination(from,n).toArray();
	      	  	for(var c=0;c < combs.length; c++){
	      	  	  var comb = combs[c];
	      	  	  var canbe = _.reduce(comb,function(memo,sid){
	                return _.uniq(memo.concat(squares[sid].canBeArr));
	      	  	  },[]);
	      	  	  if (canbe.length && canbe.length<=n){
	      	  	  	var others = house.squares.filter(function(sid){
	      	  	  	  var s = squares[sid];
	      	  	  	  return !s.is && comb.indexOf(sid)===-1 && _.intersection(s.canBeArr,canbe).length;
	      	  	  	});
	      	  	  	if (others.length){
	      	  	  	  return {house:hid,removecands:canbe,squares:comb,cleanse:others}	
	      	  	  	}
	      	  	  }
	      	  	}
	      	}
      	  }
      	}
      }
  	},
  	describe:function(o,squares,houses){
  	  return ["Because",{sids:o.squares},"can only be",{cands:o.removecands},"those can't be found elsewhere in",{hid:o.house},"such as in",{sids:o.cleanse,c:"removedfrom"}];
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
  	},
  	describe:function(o,squares,houses){
  	  return ["In",{hid:o.house},{cands:o.keepcands},"can only be found in",{sids:o.cleanse,c:"removedfrom"},"so those squares can't be anything else"];
  	}
  },
  xwing: {
  	find: function(squares,houses){
  	  for(var n=2;n<=3;n++){
  	  for(var t=0;t<=1;t++){
  	  	var type = ["row","col"][t];
  	    for(var cand=1;cand<=9;cand++){
  	      var lids = _.filter(_.map(onetonine,function(i){return type+i;}),function(lid){return !houses[lid].has[cand] && houses[lid].placesFor[cand].length === 2;} );
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
  	          	  return {type:type,squares:nodes,removecand:cand,cleanse:others,lines:comb};
  	          	}
  	          }
  	        }
  	      }
        }
  	  }
  	  }
  	},
  	describe: function(o,squares,houses){
  	  return ["Because the only two options for",{cand:o.removecand},"in",{hids:o.lines},"are in sync in ",{sids:o.squares},{sids:o.cleanse,c:"removedfrom"},"can't be",{cand:o.removecand}];
  	}
  },
  hook: {
  	find: function(squares,houses){
  	  for(var sid1 in squares){
  	  	var s1 = squares[sid1];
  	  	if (s1.canBeArr.length === 2){
  	  	  for(var i2 in s1.linecousins){
  	  	  	var sid2 = s1.linecousins[i2], s2 = squares[sid2];
  	  	  	if (s2.canBeArr.length === 2){
  	  	  	  var inters = _.intersection(s1.canBeArr,s2.canBeArr);
  	  	  	  if (inters.length===1){
  	  	  	  	var stem = inters[0], flower = _.difference(s2.canBeArr,inters)[0], root = _.difference(s1.canBeArr,inters)[0];
  	  	  	    for(var i3 in s2.boxmates){
  	  	  	      var sid3 = s2.boxmates[i3], s3 = squares[sid3];
  	  	  	      if (s3.canBeArr.length === 2 && !_.difference(s3.canBeArr,[flower,root]).length){
  	  	  	      	var cleanse = _.filter(_.intersection(s3.friends,s1.friends),function(cid){
  	  	  	      	  return cid !== sid2 && !squares[cid].is && squares[cid].canBe[root];
  	  	  	      	});
  	  	  	      	if (cleanse.length){
  	  	  	      	  var lines = commonHouses(sid1,sid2).concat(commonHouses(sid2,sid3).concat(commonHouses(sid3,cleanse[0])).concat(commonHouses(cleanse[0],sid1)));
  	  	  	      	  return {squares:[sid2,sid3],othersquare:sid1,cleanse:cleanse,removecand:root,lines:lines};
  	  	  	      	}
  	  	  	      }
  	  	  	    }
  	  	  	  }
  	  	  	}
  	  	  }
  	  	}
  	  }
  	},
  	describe: function(o,squares,houses){
  	  return ["From",{sid:o.othersquare,c:"odd"},"we form a hook with",{sids:o.squares},"which means the hook cand",{cand:o.removecand},"can't be in",{sids:o.cleanse,c:"removedfrom"}]
  	}
  },
  alternatepair: {
  	find: function(squares,houses){
  	  for(var cand=1;cand<=9;cand++){
  	  	var links = _.reduce(houses,function(memo,h,hid){
  	  	  var p = h.placesFor[cand]
  	  	  if(p.length===2){
  	  	  	memo.push({head:p[0],tail:p[1],house:hid,sqrs:_.object(p,["odd","even"])})
  	  	  }
  	  	  return memo;
  	  	},[]);
  	  	var trans = {odd:"even",even:"odd"}
  	  	var chains = _.reduce(links,function(memo,link,hid){
  	  	  var mhead, mtail;
  	  	  for(var c=0;c < memo.length;c++){
  	  	  	if (memo[c].sqrs[link.head]){
  	  	  	  mhead=c;
  	  	  	} else if (memo[c].sqrs[link.tail]) {
  	  	  	  mtail=c;
  	  	  	}
  	  	  }
  	  	  if (mhead!==undefined&&mtail===undefined){
  	  	  	memo[mhead].sqrs[link.tail]=trans[memo[mhead].sqrs[link.head]];
  	  	  	memo[mhead].houses.push(link.house);
  	  	  } else if (mhead===undefined&&mtail!==undefined){
  	  	  	memo[mtail].sqrs[link.head]=trans[memo[mtail].sqrs[link.tail]];
  	  	  	memo[mtail].houses.push(link.house);
  	  	  } else if (mhead===undefined&&mtail===undefined){
  	  	  	memo.push({houses:[link.house],sqrs:link.sqrs});
  	  	  } else {
  	  	  	memo = [{
  	  	  	  houses:memo[mhead].houses.concat(memo[mtail].houses.concat(link.house)),
  	  	  	  sqrs:_.extend(memo[mhead].sqrs,memo[mhead].sqrs[link.head]!==memo[mtail].sqrs[link.tail]?memo[mtail].sqrs:_.mapValues(memo[mtail].sqrs,function(v){
  	  	  	    return trans[v];
  	  	  	  }))
  	  	  	}].concat(_.filter(memo,function(i,n){return n!==mhead&&n!==mtail}));
  	  	  }
          return memo;
  	  	},[]);
  	  	for(var c=0;c < chains.length;c++){
  	  	  var chain = chains[c];
  	  	  var d = _.reduce(chain.sqrs,function(memo,v,sid){
  	  	  	var s = squares[sid], hids = memo[v+"hids"];
            memo[v].push(sid);
            memo[v+"friends"] = _.uniq(memo[v+"friends"].concat(s.friends));
            if (hids[s.row]){memo[v+"bads"].push(s.row);}
            if (hids[s.col]){memo[v+"bads"].push(s.col);}
            if (hids[s.box]){memo[v+"bads"].push(s.box)}
            memo[v+"hids"] = _.extend(hids,_.object([s.row,s.col,s.box],[1,1,1]));
            return memo;
  	  	  },{odd:[],oddfriends:[],oddhids:{},oddbads:[],even:[],evenfriends:[],evenhids:{},evenbads:[]});
  	  	  if (d.oddbads.length){
  	  	  	return {setsquares:d.even,squares:d.odd,setcand:cand,houses:d.oddbads,n:"collapse"};
  	  	  } else if (d.evenbads.length){
  	  	  	return {setsquares:d.odd,squares:d.even,setcand:cand,houses:d.evenbads,n:"collapse"};
  	  	  } else {
  	  	    var seesboth = _.filter(_.difference(_.intersection(d.oddfriends,d.evenfriends),d.odd,d.even),function(sid){
              return !squares[sid].is && squares[sid].canBe[cand];
  	  	    });
  	  	    if (seesboth.length){
  	  	  	  return {cleanse:seesboth,removecand:cand,squares:d.even,othersquares:d.odd,houses:chain.houses}
  	  	    }
  	  	  }
  	  	}
  	  }
  	},
  	describe: function(o,squares,houses){
  	  if (!o.n){
  	  	return [{sids:o.squares},"and",{sids:o.squares,c:"odd"},"form a chain for",{cand:o.removecand},"which then can't be in",{sids:o.cleanse,c:"removedfrom"}];
  	  } else {
  	  	return [{sids:o.squares},"and",{sids:o.setsquares,c:"solved"},"form a chain for",{cand:o.setcand},"but the former group sees itself so the latter must be correct"];
  	  }
  	}
  }
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
    fromdragon1: [ // challenging, no solve with ->hook!
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
    swordfishexample: [ // has swordfish, then solveable
      "801050030",
      "903068000",
      "040003508",
      "600902000",
      "080030040",
      "300501007",
      "502000080",
      "000370009",
      "030020100"
    ],
    hookexample: [ // not finally solveable -> hook. is one hook though
      "680052073",
      "042009658",
      "050080012",
      "870520130",
      "005803720",
      "020090845",
      "230060500",
      "018935260",
      "500200301"
    ],
    altpairexample: [ // collapsing chain
      "783002540",
      "140083720",
      "026070381",
      "492361857",
      "371958264",
      "658247193",
      "200030978",
      "830720015",
      "007800032"
    ],
    altpairagain: [
      "062070008",
      "000060390",
      "400000106",
      "200007861",
      "600102000",
      "014600003",
      "008000615",
      "056010030",
      "000056780"
    ]
  }
};