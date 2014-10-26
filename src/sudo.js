var onetonine = _.range(1,10);

var squares = _.reduce(onetonine,function(memo,row){
  _.each(onetonine,function(col){
    memo["r"+row+"c"+col]={
      row:"row"+row,
      col:"col"+col,
      id:"r"+row+"c"+col,
      box: "box"+(Math.floor((col-1)/3)+1+Math.floor((row-1)/3)*3),
      canBe: _.reduce(onetonine,function(memo,c){memo[c]=true;return memo;},{})
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


var calcHouse = function(house,squares){
  return _.extend(_.reduce(house.squares,function(memo,sid){
    var square = squares[sid];
    if (square.is){
      memo.has[square.is] = true;
    } else {
      _.each(square.canBe,function(b,cand){
        if (b){
          memo.placesFor[cand].push(sid);
        }
      });
    }
    return memo;
  },{
    placesFor:  _.reduce(onetonine,function(memo,c){memo[c]=[];return memo;},{}),
    has: _.reduce(onetonine,function(memo,c){memo[c]=false;return memo;},{})
  }),house);
};

var performAction = function(action,squares){
  switch(action[0]){
    case "set": squares[action[1]].is = action[2]; break;
    case "cantbe": squares[action[1]].canBe[action[2]] = false; break;
  }
  return squares;
};

var performActions = function(actions,squares){
  _.each(actions,function(action){
    squares = performAction(action,squares);
  });
  return squares;
};

var settingConsequences = function(square,cand){
  return _.reduce(square.friends,function(memo,oid){
  	return squares[oid].canBe[cand] ? memo.concat([["cantbe",oid,cand]]) : memo;
  },[]);
};

var sudo = {
  squares: squares,
  houses: _.reduce(houses,function(memo,house,id){
    memo[id] = calcHouse(house,squares);
    return memo;
  },{}),
  calcHouse: calcHouse,
  performAction: performAction,
  performActions: performActions,
  settingConsequences: settingConsequences
};