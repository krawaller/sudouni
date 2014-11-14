var _ = require("lodash"),
    Combinatorics = require("./combinatorics").Combinatorics;



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
  square.houses = [square.row,square.col,square.box];
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
              memo.housesFor[cand][type].obj[square[type]] = true;
              memo.housesFor[cand][type].arr.push(square[type]);
            }
          });
        }
      });
      memo.emptySquares.push(sid);
    }
    return memo;
  },{
    placesFor:  _.reduce(onetonine,function(memo,c){memo[c]=[];return memo;},{}),
    has: _.reduce(onetonine,function(memo,c){memo[c]=false;return memo;},{}),
    remaining: [].concat(onetonine),
    emptySquares: [],
    housesFor: _.reduce(onetonine,function(memo,c){
      memo[c] = { row:{arr:[],obj:{}}, col:{arr:[],obj:{}}, box:{arr:[],obj:{}} };
      return memo;
    },{})
  }));
};

var calculateMeta = function(squares){
  return _.extend(_.reduce(squares,function(ret,s,sid){
    if (s.is){
      ret.doneSquares.push(sid);
    } else {
      ret.remainingSquares.push(sid);
      ret["misses"+s.canBeArr.length] = (ret["misses"+s.canBeArr.length]||[]).concat(sid);
    }
    return ret;
  },{doneSquares:[],remainingSquares:[]}),_.reduce(houses,function(memo,h){
    memo[h.type==="box"?"boxes":"lines"].push(h.id);
    return memo;
  },{boxes:[],lines:[]}));
};

var calcHouses = function(houses,sqrs){
  return _.reduce(houses,function(memo,house,id){
    memo[id] = calcHouse(house,sqrs);
    return memo;
  },{});
};

var calculateStartingData = function(sudodef){
  return performEffectsOnData({
    squares: _.cloneDeep(squares),
    houses: houses,
    meta: calculateMeta(squares)
  },setupToInstructions(sudodef));
};

var performEffectsOnData = function(d,effects){
  var newsquares = performEffects(effects,d.squares);
  return {
    squares: newsquares,
    houses: calcHouses(houses,newsquares),
    meta: calculateMeta(newsquares)
  };
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
  return [];
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

var inferEffectHighlights = function(effect){
  return _.reduce(effect,function(memo,i){
  	memo[i[1]] = {cantbe:"removedfrom","set":"solved"}[i[0]];
    return memo;
  },{});
}

var inferInputEffects = function(input,d){
  if (input.square && input.setcand){
  	return [["set",input.square,input.setcand]];
  } else if (input.cleanse && (input.removecand || input.removecands)){
    return _.reduce([].concat(input.cleanse),function(memo,sid){
      return memo.concat(_.reduce((input.removecands || []).concat(input.removecand || []),function(m,c){
        return m.concat([["cantbe",sid,c]]);
      },[]));
    },[]);
  } else if (input.setsquares && input.setcand){
  	return _.map(input.setsquares,function(sid){
  	  return ["set",sid,input.setcand];
  	});
  }
  console.log("INPUT",input);
  throw "Couldn't infer effect!";
};

var inferInputHighlights = function(input){
  var used = {house:1,line:1,row:1,col:1,box:1,line1:1,line2:1,line3:1,othersquare:1,square:1},
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
  	var s = squares[sid];
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
  alreadyPlaced: {
    find: function(d){
      return _.reduce(d.meta.doneSquares,function(ret,sid){
        var s = d.squares[sid], cleanse = _.filter(s.friends,function(fid){ return !d.squares[fid].is && d.squares[fid].canBe[s.is]});
        return cleanse.length ? ret.concat({cleanse:cleanse,removecand:s.is,houses:s.houses,square:sid}) : ret;
      },[]);
    },
    describe:function(input,d){
      return ["Since",{sid:input.square},"is",{cand:input.removecand},"it can't be in",{sids:input.cleanse,c:"removedfrom"},"since they share a house."];
    }
  },
  justOneCand: {
  	find: function(d){
      return _.map(d.meta.misses1,function(sid){ return {square:sid,setcand:d.squares[sid].canBeArr[0]};});
  	},
  	describe:function(input,d){
  	  return ["The only possibility in",{sid:input.square,c:"solved"},"is",{cand:input.setcand}];
  	}
  },
  onlyPlace: {
    find: function(d){
      return _.reduce(d.houses,function(houseloop,house,hid){
        return houseloop.concat(_.reduce(house.remaining,function(candloop,c){
          return !house.has[c] && house.placesFor[c].length === 1 ? candloop.concat([{square:house.placesFor[c][0],house:house.id,setcand:c}]) : candloop;
        },[]));
      },[]);
    },
    describe:function(o,squares,houses){
  	  return ["The only place for",{cand:o.setcand},"in",{hid:o.house},"is",{sid:o.square,c:"solved"}];
  	}
  },
  lance: {
    find: function(d){
      return _.reduce(d.meta.boxes,function(boxloop,bid){
        var b = d.houses[bid];
        return boxloop.concat(_.reduce(b.remaining,function(candloop,c){
          return candloop.concat( _.reduce(_.filter([b.housesFor[c].row.arr,b.housesFor[c].col.arr],function(a){return a.length===1;}),function(lineloop,a){
            var l = d.houses[a[0]], cleanse=_.difference(l.placesFor[c],b.placesFor[c]);
            return cleanse.length ? lineloop.concat({box:b.id,type:l.type,line:l.id,removecand:c,poss:b.placesFor[c],cleanse:cleanse}) : lineloop;
          },[]));
        },[]));
      },[]);
    },
    describe:function(o,squares,houses){
      return ["As all possibilities for",{cand:o.removecand},"in",{hid:o.box},"are found in",{hid:o.line},"it can't be elsewhere in the line such as in",{sids:o.cleanse,c:"removedfrom"}];
    }
  },
  flag: {
    find: function(d){
      return _.reduce(d.meta.boxes,function(boxloop,bid){
        var b = d.houses[bid];
        return boxloop.concat(_.reduce(b.remaining,function(candloop,c){
          return candloop.concat( _.reduce(b.housesFor[c].row.arr.concat(b.housesFor[c].col.arr),function(lineloop,lid){
            var l = d.houses[lid], cleanse=l.housesFor[c].box.arr.length===1?_.difference(b.placesFor[c],l.placesFor[c]):[];
            return cleanse.length ? lineloop.concat({box:b.id,type:l.type,line:l.id,removecand:c,poss:b.placesFor[c],cleanse:cleanse}) : lineloop;
          },[]));
        },[]));
      },[]);
    },
    describe:function(o,squares,houses){
      return ["As all possibilities for",{cand:o.removecand},"in",{hid:o.line},"are found in",{hid:o.box},"it can't be elsewhere in the box such as in",{sids:o.cleanse,c:"removedfrom"}]
    }
  },
  nakedgroup: {
    find: function(d){
      return _.reduce([2,3,4,5],function(nloop,n){
        return nloop.concat(_.reduce(d.houses,function(houseloop,house,hid){
          var from = house.emptySquares.length>n ? _.filter(house.emptySquares,function(sid){return d.squares[sid].canBeArr.length<=n;}) : [];
          var combs = from.length>=n ? Combinatorics.combination(from,n).toArray() : [];
          return houseloop.concat(_.reduce(combs,function(combloop,comb){
            var canbe = _.reduce(comb,function(memo,sid){ return _.uniq(memo.concat(d.squares[sid].canBeArr)); },[]);
            var others = canbe.length && canbe.length<=n ? house.squares.filter(function(sid){ return !d.squares[sid].is && comb.indexOf(sid)===-1 && _.intersection(d.squares[sid].canBeArr,canbe).length; }) : [];
            return others.length ? combloop.concat({house:hid,removecands:canbe,squares:comb,cleanse:others}) : combloop;
          },[]));
        },[]));
      },[]);
    },
  	describe:function(input,d){
  	  return ["Because",{sids:input.squares},"can only be",{cands:input.removecands},"those can't be found elsewhere in",{hid:input.house},"such as in",{sids:input.cleanse,c:"removedfrom"}];
  	}
  },
  hiddengroup: {
    find: function(d){
      return _.reduce(d.houses,function(houseloop,house,hid){
        var cands = _.filter(house.remaining,function(c){return house.placesFor[c].length >= 1 && house.placesFor[c].length < house.emptySquares.length; });
        return houseloop.concat(_.reduce(_.range(1,Math.min(cands.length,house.emptySquares.length-1)+1),function(nloop,n){
          return nloop.concat(_.reduce(Combinatorics.combination(cands,n).toArray(),function(combloop,comb){
            var poss = _.uniq(_.reduce(comb,function(memo,cand){ return memo.concat(house.placesFor[cand]); },[]));
            var cleanse = (poss.length === n ? _.filter(poss,function(sid){ return _.difference(d.squares[sid].canBeArr,comb).length; }) : []);
            return cleanse.length ? combloop.concat({house:hid,cleanse:cleanse,keepcands:comb,poss:poss}) : combloop;
          },[]));
        },[]));
      },[]);
    },
  	effect: function(input,d){
      return _.reduce(input.cleanse,function(memo,sid){
        var rest = _.difference(d.squares[sid].canBeArr,input.keepcands);
        return memo.concat(_.map(rest,function(c){
          return ["cantbe",sid,c];
        }));
      },[]);
  	},
  	describe:function(input,d){
  	  return ["In",{hid:input.house},{cands:input.keepcands},"can only be found in",{sids:input.poss},"so ",{sids:input.cleanse,c:"removedfrom"}," can't be anything else"];
  	}
  },
  xwing: {
    find: function(d){
      return _.reduce([2,3,4,5],function(nloop,n){
        return nloop.concat(_.reduce(["row","col"],function(typeloop,type){
          return typeloop.concat(_.reduce(onetonine,function(candloop,cand){
            var lids = _.filter(_.map(onetonine,function(i){return type+i;}),function(lid){return !d.houses[lid].has[cand] && d.houses[lid].placesFor[cand].length >=2 && d.houses[lid].placesFor[cand].length <= n;} );
            return candloop.concat(lids.length < n ? [] : _.reduce(Combinatorics.combination(lids,n).toArray(),function(combloop,comb){
              var nodes = _.flatten(_.map(comb,function(lid){return d.houses[lid].placesFor[cand]})).sort();
              var crosslids = houseTypeList(nodes,{row:"col",col:"row"}[type]);
              var others = crosslids.length !== n ? [] : _.difference(_.uniq(_.flatten(_.map(crosslids,function(clid){return d.houses[clid].placesFor[cand];}))),nodes);
              return others.length ? combloop.concat({type:type,squares:nodes,removecand:cand,cleanse:others,lines:comb}) : combloop;
            },[]));
          },[]));
        },[]));
      },[]);
    },
  	describe: function(o,squares,houses){
  	  return ["Because the options for",{cand:o.removecand},"in",{hids:o.lines},"are in sync in",{sids:o.squares},"we know that",{sids:o.cleanse,c:"removedfrom"},"can't be",{cand:o.removecand}];
  	}
  },
  xywing: {
    find: function(d){
      return _.reduce(d.meta.misses2,function(rootloop,rid){
        var root = d.squares[rid], friendsw2 = _.filter(_.intersection(d.meta.misses2,root.friends),function(fid){return _.intersection(d.squares[fid].canBeArr,root.canBeArr).length === 1;});
        return rootloop.concat( friendsw2.length < 2 ? [] : _.reduce(Combinatorics.combination(friendsw2,2).toArray(),function(combloop,comb){
          var fid1=comb[0], fid2=comb[1], f1=d.squares[fid1], f2=d.squares[fid2], common = _.intersection(f1.canBeArr,f2.canBeArr);
          var cleanse=common.length===1&&!_.contains(root.canBeArr,common[0])?_.filter(_.without(_.intersection(f1.friends,f2.friends),rid,fid1,fid2),function(tid){return !d.squares[tid].is && d.squares[tid].canBe[common[0]]}):[];
          return cleanse.length ? combloop.concat({squares:[fid1,fid2],othersquare:rid,cleanse:cleanse,removecand:common[0]}) : combloop;
        },[]));
      },[]);
    },
  	describe: function(input,d){
  	  return ["From",{sid:input.othersquare,c:"odd"},"we form a xywing with",{sids:input.squares},"which means the hook cand",{cand:input.removecand},"can't be in",{sids:input.cleanse,c:"removedfrom"}]
  	}
  },
  xyzwing: {
    find: function(d){
      return _.reduce(d.meta.misses3,function(rootloop,rid){
        var root = d.squares[rid], friendsw2 = _.filter(_.intersection(d.meta.misses2,root.friends),function(fid){return _.intersection(d.squares[fid].canBeArr,root.canBeArr).length === 2;});
        return rootloop.concat( friendsw2.length < 2 ? [] : _.reduce(Combinatorics.combination(friendsw2,2).toArray(),function(combloop,comb){
          var fid1=comb[0], fid2=comb[1], f1=d.squares[fid1], f2=d.squares[fid2], common = _.intersection(f1.canBeArr,f2.canBeArr);
          var cleanse=common.length===1?_.filter(_.without(_.intersection(f1.friends,f2.friends,root.friends),rid,fid1,fid2),function(tid){return !d.squares[tid].is && d.squares[tid].canBe[common[0]]}):[];
          return cleanse.length ? combloop.concat({squares:[fid1,fid2],othersquare:rid,cleanse:cleanse,removecand:common[0]}) : combloop;
        },[]));
      },[]);
    },
    describe: function(input,d){
      return ["From",{sid:input.othersquare,c:"odd"},"we form a xyzwing with",{sids:input.squares},"which means the hook cand",{cand:input.removecand},"can't be in",{sids:input.cleanse,c:"removedfrom"}]
    }
  },
  hinge: {
    find: function(d){
      return _.reduce(onetonine,function(candloop,c){
        return candloop.concat(_.reduce(_.filter(d.houses,function(h){return h.type!=="box"&&h.placesFor[c].length===2&&d.squares[h.placesFor[c][0]].box!==d.squares[h.placesFor[c][1]].box;}),function(houseloop,h){
          return houseloop.concat(_.reduce([h.placesFor[c],[].concat(h.placesFor[c]).reverse()],function(orderloop,order){
            var s1=d.squares[order[0]], s2=d.squares[order[1]],perp=h.type==="row"?"col":"row",tline=d.houses[s1[perp]],targets=_.filter(tline.placesFor[c],function(tid){return d.squares[tid].box!==s1.box;});
            return orderloop.concat(_.reduce(targets,function(targetloop,tid){
              var t=d.squares[tid],box=d.houses[d.squares[_.without(_.intersection(t.friends,s2.friends),s1.id)[0]].box], others=_.difference(box.squares,t.friends,s2.friends);
              var wrongs=_.filter(others,function(oid){ return d.squares[oid].is === c || (!d.squares[oid].is && d.squares[oid].canBe[c]); });
              return wrongs.length ? targetloop : targetloop.concat({type:h.type,squares:[s1.id,s2.id],othersquares:others,cleanse:[t.id],removecand:c,houses:[h.id,t[h.type],s1[perp],s2[perp],box.id]});
            },[]));
          },[]));
        },[]));
      },[]);
    },
    describe: function(input,d){
      return [{sids:input.squares},"are the only options for",{cand:input.removecand},"in their",{type:input.type},"and",{sids:input.cleanse},"can see both because",{sids:input.othersquares,c:"odd"},"bends line of sight."];
    }
  },
  colorwing: {
    find: function(d){
      return _.reduce(onetonine,function(candloop,cand){
        var used={}, links = _.reduce(d.houses,function(memo,h,hid){
          var p = h.placesFor[cand], pid = p.sort().join("-");
          if(p.length===2 && !used[pid]){
            memo.push({hid:h.id,arr:p.sort(),bw:[].concat(p.sort()).reverse()});
            used[pid]=1;
          }
          return memo;
        },[]);
        return links.length < 2 ? candloop : candloop.concat(_.reduce(Combinatorics.combination(links,2).toArray(),function(combloop,comb){
          return _.intersection(comb[0].arr,comb[1].arr).length ? combloop : combloop.concat(_.reduce([["arr","arr"],["arr","bw"],["bw","arr"],["bw","bw"]],function(orderloop,order){
            var sidh1=comb[0][order[0]][0], sidh2=comb[1][order[1]][0], tail1=d.squares[comb[0][order[0]][1]], tail2=d.squares[comb[1][order[1]][1]];
            var cleanse = _.contains(d.squares[sidh1].friends,sidh2) ? _.filter(_.intersection(tail1.friends,tail2.friends),function(cid){return cid!==sidh1&&cid!==sidh2&&!d.squares[cid].is && d.squares[cid].canBe[cand];}) : [];
            return cleanse.length ? orderloop.concat({othersquares:[sidh1,sidh2],squares:[tail1.id,tail2.id],houses:[comb[0].hid,comb[1].hid],removecand:cand,cleanse:cleanse}) : orderloop;
          },[]));
        },[]));
      },[]);
    },
    describe: function(input,d){
      return ["Because",{sids:input.othersquares,c:"odd"},"can see each others the pairs for",{cand:input.removecand},"in",{hids:input.houses},"are connected and since",{sids:input.cleanse,c:"removedfrom"},"sees both",{sids:input.squares},"they can't be",{cand:input.removecand}];
    }
  },
  alternatepair: {
    find: function(d){
      return _.reduce(onetonine,function(candloop,cand){
        var used={}, links = _.reduce(d.houses,function(memo,h,hid){
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
          var analysis = _.reduce(chain.sqrs,function(memo,v,sid){
            var s = d.squares[sid], hids = memo[v+"hids"];
            memo[v].push(sid);
            memo[v+"friends"] = _.uniq(memo[v+"friends"].concat(s.friends));
            _.each(["row","col","box"],function(t){if(hids[s[t]]){memo[v+"bads"].push(s[t]);}});
            memo[v+"hids"] = _.extend(hids,_.object([s.row,s.col,s.box],[1,1,1]));
            return memo;
          },{odd:[],oddfriends:[],oddhids:{},oddbads:[],even:[],evenfriends:[],evenhids:{},evenbads:[]});
          if (analysis.oddbads.length){
            chainloop.push({setsquares:analysis.even,squares:analysis.odd,setcand:cand,houses:analysis.oddbads,n:"collapse"});
          } else if (analysis.evenbads.length){
            chainloop.push({setsquares:analysis.odd,squares:analysis.even,setcand:cand,houses:analysis.evenbads,n:"collapse"});
          } else {
            var seesboth = _.filter(_.difference(_.intersection(analysis.oddfriends,analysis.evenfriends),analysis.odd,analysis.even),function(sid){ return !d.squares[sid].is && d.squares[sid].canBe[cand]; });
            if (seesboth.length){
              chainloop.push({cleanse:seesboth,removecand:cand,squares:analysis.even,othersquares:analysis.odd,houses:chain.houses});
            }
          }
          return chainloop;
        },[]));
      },[]);
    },
  	describe: function(input,d){
  	  if (!input.n){
  	  	return [{sids:input.squares},"and",{sids:input.othersquares,c:"odd"},"form a chain for",{cand:input.removecand},"which then can't be in",{sids:input.cleanse,c:"removedfrom"}];
  	  } else {
  	  	return [{sids:input.squares},"and",{sids:input.setsquares,c:"solved"},"form a chain for",{cand:input.setcand},"but the former group sees itself so the latter must be correct"];
  	  }
  	}
  }
};

var scrambleNumbers = function(def){
  var r = [0].concat(_.shuffle(_.range(1,10)));
  return _.map(def,function(row){
    return _.map(row.split(''),function(char){ return r[+char]}).join('');
  });
};

var swapRowTriples = function(def){
  return _.map(_.flatten(_.shuffle([[0,1,2],[3,4,5],[6,7,8]])),function(n){
    return def[n];
  });
};

var swapColumnTriples = function(def){
  var r = _.flatten(_.shuffle([[0,1,2],[3,4,5],[6,7,8]]));
  return _.map(def,function(row){
    return _.map(r,function(n){ return row[n]; }).join('');
  });
};

var shuffleRowTriples = function(def){
  return _.map(_.flatten([_.shuffle([0,1,2]),_.shuffle([3,4,5]),_.shuffle([6,7,8])]),function(n){
    return def[n];
  });
};

var shuffleColumnTriples = function(def){
  var r = _.flatten([_.shuffle([0,1,2]),_.shuffle([3,4,5]),_.shuffle([6,7,8])]);
  return _.map(def,function(row){
    return _.map(r,function(n){ return row[n]; }).join('');
  });
};

module.exports = {
  calculateStartingData: calculateStartingData,
  performEffectsOnData: performEffectsOnData,
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
  calculateMeta: calculateMeta,
  techs: techs,
  scrambles: {
    scrambleNumbers: scrambleNumbers,
    swapRowTriples: swapRowTriples,
    swapColumnTriples: swapColumnTriples,
    shuffleRowTriples: shuffleRowTriples,
    shuffleColumnTriples: shuffleColumnTriples
  },
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
    fromdragon1: [ // challenging, no solve with ->colorwing!
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
    hookexample: [ // solvable with forced hook & hinge
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
    ],
    xyzwingexample: [
      "049070000",
      "207000900",
      "035006000",
      "528760400",
      "000809000",
      "001004068",
      "000100020",
      "003000105",
      "002040370"
    ],
    hingeexample: [
      "509002607",
      "000000000",
      "700408002",
      "054090108",
      "000504009",
      "003020504",
      "400201003",
      "000040000",
      "802000406"
    ],
    jellyfish: [
      "043180065",
      "850460000",
      "016350849",
      "425036080",
      "000204056",
      "670805432",
      "504021600",
      "060508014",
      "100643500"
    ],
    colorwing: [ // nonsolve after
      "385020090",
      "916005002",
      "247000000",
      "000007050",
      "600040009",
      "000200000",
      "000000830",
      "800100907",
      "030080041"
    ]
  }
};