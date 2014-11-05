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

var performEffect = function(action,squares){
  if (action[0]==="set"){
  	squares[action[1]].is = action[2];
  	return performEffects( settingConsequences(squares[action[1]],action[2]), squares );
  }
  squares[action[1]].canBe[action[2]] = false;
  squares[action[1]].canBeArr = _.without(squares[action[1]].canBeArr,action[2]);
  return squares;
};

var performEffects = function(actions,squares){
  _.each(actions,function(action){
    squares = performEffect(action,squares);
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

var inferEffectHighlights = function(instr){
  return _.reduce(instr,function(memo,i){
  	memo[i[1]] = {cantbe:"removedfrom","set":"solved"}[i[0]];
    return memo;
  },{});
}

var inferInputEffects = function(o,squares,houses){
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

var inferInputHighlights = function(input){
  var used = {house:1,line:1,row:1,col:1,box:1,line1:1,line2:1,line3:1,othersquare:1},
      multi = {poss:1,squares:1,lines:1,othersquares:1,houses:1};
  var ret = _.reduce(input,function(memo,val,key){
    if (used[key]){
      memo[val] = key==="othersquare"?"odd":"used";
    } else if (multi[key]){
      _.map(val,function(id){
        memo[id] = (key==="othersquares"?"odd":"used");
      });
    }
    return memo;
  },{});
  var cands = _.reduce(_.flatten(_.compact(_.reduce(["setcand","setcands","removecand","removecands","keepcand","keepcands"],function(m,k){return m.concat(input[k])},[]))),function(o,c){
    o[c] = "candmark";
    return o;
  },{});
  _.each(Object.keys(ret).concat(Object.keys(input)).concat(_.values(input)).concat(input.cleanse||[]).concat(input.setsquares||[]),function(sid){
    if (squares[sid]){
      ret[sid+"cands"] = cands;
    }
  });
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
      return _.reduce(squares,function(ret,sqr,sid){
        return !squares[sid].is && squares[sid].canBeArr.length === 1 ? ret.concat({square:sid,setcand:sqr.canBeArr[0]}) : ret;
      },[]);
  	},
  	describe:function(o,squares,houses){
  	  return ["The only possibility in",{sid:o.square,c:"solved"},"is",{cand:o.setcand}];
  	}
  },
  onlyPlace: {
    find: function(squares,houses){
      return _.reduce(houses,function(ret,house,hid){
        return ret.concat(_.reduce(onetonine,function(memo,c){
          return !house.has[c] && house.placesFor[c].length === 1 ? memo.concat([{square:house.placesFor[c][0],house:house.id,setcand:c}]) : memo;
        },[]));
      },[]);
    },
    describe:function(o,squares,houses){
  	  return ["The only place for",{cand:o.setcand},"in",{hid:o.house},"is",{sid:o.square,c:"solved"}];
  	}
  },
  lance: {
    find: function(squares,houses){
      return _.reduce(onetonine,function(ret,i){
        var box = houses["box"+i];
        _.map(box.remaining,function(cand){
          _.map(["row","col"],function(type){
            if (box.housesFor[cand][type].arr.length === 1){
              var line = houses[box.housesFor[cand][type].arr[0]];
              var cleanse = _.difference(line.placesFor[cand],box.placesFor[cand]);
              if (cleanse.length){
                ret.push({
                  box:box.id,type:type,line:line.id,removecand:cand,poss:box.placesFor[cand],cleanse:cleanse
                });
              }
            }
          });
        });
        return ret;
      },[]);
    },
    describe:function(o,squares,houses){
      return ["As all possibilities for",{cand:o.removecand},"in",{hid:o.box},"are found in",{hid:o.line},"it can't be elsewhere in the line such as in",{sids:o.cleanse,c:"removedfrom"}];
    }
  },
  flag: {
    find: function(squares,houses){
      return _.reduce(["row","col"],function(typeloop,type){
        return typeloop.concat(_.reduce(onetonine,function(iloop,i){
          var line = houses[type+i];
          return iloop.concat(_.reduce(line.remaining,function(candloop,cand){
            if (line.housesFor[cand].box.arr.length===1){
              var box = houses[line.housesFor[cand].box.arr[0]];
              var cleanse = _.difference(box.placesFor[cand],line.placesFor[cand]);
              if (cleanse.length){
                return candloop.concat({box:box.id,type:type,line:line.id,removecand:cand,poss:line.placesFor[cand],cleanse:cleanse});
              }
            }
            return candloop; 
          },[]))
        },[]))
      },[]);
    },
    describe:function(o,squares,houses){
      return ["As all possibilities for",{cand:o.removecand},"in",{hid:o.line},"are found in",{hid:o.box},"it can't be elsewhere in the box such as in",{sids:o.cleanse,c:"removedfrom"}]
    }
  },
  closedgroup: {
    find: function(squares,houses){
      return _.reduce([2,3,4],function(nloop,n){
        return nloop.concat(_.reduce(houses,function(houseloop,house,hid){
          var from = house.emptySquares.length>n ? _.filter(house.emptySquares,function(sid){return squares[sid].canBeArr.length<=n;}) : [];
          var combs = from.length>=n ? Combinatorics.combination(from,n).toArray() : [];
          return houseloop.concat(_.reduce(combs,function(combloop,comb){
            var canbe = _.reduce(comb,function(memo,sid){ return _.uniq(memo.concat(squares[sid].canBeArr)); },[]);
            var others = canbe.length && canbe.length<=n ? house.squares.filter(function(sid){
              var s = squares[sid];
              return !s.is && comb.indexOf(sid)===-1 && _.intersection(s.canBeArr,canbe).length;
            }) : [];
            return others.length ? combloop.concat({house:hid,removecands:canbe,squares:comb,cleanse:others}) : combloop;
          },[]));
        },[]));
      },[]);
    },
  	describe:function(o,squares,houses){
  	  return ["Because",{sids:o.squares},"can only be",{cands:o.removecands},"those can't be found elsewhere in",{hid:o.house},"such as in",{sids:o.cleanse,c:"removedfrom"}];
  	}
  },
  innergroup: {
    find: function(){
      return _.reduce(houses,function(houseloop,house,hid){
        var cands = _.filter(house.remaining,function(c){return house.placesFor[c].length >= 1 && house.placesFor[c].length < house.emptySquares.length; });
        return houseloop.concat(_.reduce(_.range(2,Math.min(cands.length,house.emptySquares.length-1)+1),function(nloop,n){
          return nloop.concat(_.reduce(Combinatorics.combination(cands,n).toArray(),function(combloop,comb){
            var poss = _.uniq(_.reduce(comb,function(memo,cand){ return memo.concat(house.placesFor[cand]); },[]));
            var cleanse = (poss.length === n ? _.filter(poss,function(sid){ return _.difference(squares[sid].canBeArr,comb).length; }) : []);
            return cleanse.length ? combloop.concat({house:hid,cleanse:cleanse,keepcands:comb,poss:poss}) : combloop;
          },[]));
        },[]));
      },[]);
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
  	  return ["In",{hid:o.house},{cands:o.keepcands},"can only be found in",{sids:o.poss},"so ",{sids:o.cleanse,c:"removedfrom"}," can't be anything else"];
  	}
  },
  xwing: {
    find: function(squares,houses){
      return _.reduce([2,3],function(nloop,n){
        return nloop.concat(_.reduce(["row","col"],function(typeloop,type){
          return typeloop.concat(_.reduce(onetonine,function(candloop,cand){
            var lids = _.filter(_.map(onetonine,function(i){return type+i;}),function(lid){return !houses[lid].has[cand] && houses[lid].placesFor[cand].length === 2;} );
            return candloop.concat(lids.length < n ? [] : _.reduce(Combinatorics.combination(lids,n).toArray(),function(combloop,comb){
              var nodes = _.flatten(_.map(comb,function(lid){return houses[lid].placesFor[cand]})).sort();
              var crosslids = sudo.houseTypeList(nodes,{row:"col",col:"row"}[type]);
              var others = crosslids.length !== n ? [] : _.difference(_.uniq(_.flatten(_.map(crosslids,function(clid){return houses[clid].placesFor[cand];}))),nodes);
              return others.length ? combloop.concat({type:type,squares:nodes,removecand:cand,cleanse:others,lines:comb}) : combloop;
            },[]));
          },[]));
        },[]));
      },[]);
    },
  	describe: function(o,squares,houses){
  	  return ["Because the only two options for",{cand:o.removecand},"in",{hids:o.lines},"are in sync in",{sids:o.squares},"we know that",{sids:o.cleanse,c:"removedfrom"},"can't be",{cand:o.removecand}];
  	}
  },
  hook: {
    find: function(squares,houses){
      return _.reduce(squares,function(s1loop,s1,sid1){
        return s1.canBeArr.length !== 2 ? s1loop : s1loop.concat(_.reduce(s1.linecousins,function(cousinloop,sid2){
          var s2 = squares[sid2];
          var inters = s2.canBeArr.length !== 2 ? [] : _.intersection(s1.canBeArr,s2.canBeArr);
          if (inters.length===1){
            var stem = inters[0], flower = _.difference(s2.canBeArr,inters)[0], root = _.difference(s1.canBeArr,inters)[0];
            return _.reduce(s2.boxmates,function(boxloop,sid3){
              var s3 = squares[sid3];
              var cleanse = s3.canBeArr.length === 2 && !_.difference(s3.canBeArr,[flower,root]).length ? _.filter(_.intersection(s3.friends,s1.friends),function(cid){
                return cid !== sid2 && !squares[cid].is && squares[cid].canBe[root];
              }) : [];
              return cleanse.length ? boxloop.concat({squares:[sid2,sid3],othersquare:sid1,cleanse:cleanse,removecand:root,lines:commonHouses(sid1,sid2).concat(commonHouses(sid2,sid3).concat(commonHouses(sid3,cleanse[0])).concat(commonHouses(cleanse[0],sid1)))}) : boxloop;
            },[]);
          }
          return cousinloop;
        },[]));
      },[]);
    },
  	describe: function(o,squares,houses){
  	  return ["From",{sid:o.othersquare,c:"odd"},"we form a hook with",{sids:o.squares},"which means the hook cand",{cand:o.removecand},"can't be in",{sids:o.cleanse,c:"removedfrom"}]
  	}
  },
  alternatepair: {
    find: function(squares,houses){
      return _.reduce(onetonine,function(candloop,cand){
        var used={}, links = _.reduce(houses,function(memo,h,hid){
          var p = h.placesFor[cand], pid = p.sort().join("-");
          if(p.length===2 && !used[pid]){
            memo.push({head:p[0],tail:p[1],house:hid,sqrs:_.object(p,["odd","even"])});
            used[pid]=1;
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
        return candloop.concat(_.reduce(chains,function(chainloop,chain){
          var d = _.reduce(chain.sqrs,function(memo,v,sid){
            var s = squares[sid], hids = memo[v+"hids"];
            memo[v].push(sid);
            memo[v+"friends"] = _.uniq(memo[v+"friends"].concat(s.friends));
            _.each(["row","col","box"],function(t){if(hids[s[t]]){memo[v+"bads"].push(s[t]);}});
            memo[v+"hids"] = _.extend(hids,_.object([s.row,s.col,s.box],[1,1,1]));
            return memo;
          },{odd:[],oddfriends:[],oddhids:{},oddbads:[],even:[],evenfriends:[],evenhids:{},evenbads:[]});
          if (d.oddbads.length){
            chainloop.push({setsquares:d.even,squares:d.odd,setcand:cand,houses:d.oddbads,n:"collapse"});
          } else if (d.evenbads.length){
            chainloop.push({setsquares:d.odd,squares:d.even,setcand:cand,houses:d.evenbads,n:"collapse"});
          } else {
            var seesboth = _.filter(_.difference(_.intersection(d.oddfriends,d.evenfriends),d.odd,d.even),function(sid){ return !squares[sid].is && squares[sid].canBe[cand]; });
            if (seesboth.length){
              chainloop.push({cleanse:seesboth,removecand:cand,squares:d.even,othersquares:d.odd,houses:chain.houses});
            }
          }
          return chainloop;
        },[]));
      },[]);
    },
  	describe: function(o,squares,houses){
  	  if (!o.n){
  	  	return [{sids:o.squares},"and",{sids:o.othersquares,c:"odd"},"form a chain for",{cand:o.removecand},"which then can't be in",{sids:o.cleanse,c:"removedfrom"}];
  	  } else {
  	  	return [{sids:o.squares},"and",{sids:o.setsquares,c:"solved"},"form a chain for",{cand:o.setcand},"but the former group sees itself so the latter must be correct"];
  	  }
  	}
  }
};

var sudo = {
  inferEffectHighlights: inferEffectHighlights,
  setupToInstructions: setupToInstructions,
  squares: squares,
  houses: calcHouses(houses,squares),
  calcHouse: calcHouse,
  calcHouses: calcHouses,
  performEffect: performEffect,
  performEffects: performEffects,
  settingConsequences: settingConsequences,
  inferInputEffects: inferInputEffects,
  inferInputHighlights: inferInputHighlights,
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