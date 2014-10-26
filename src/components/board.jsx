/** @jsx React.DOM */

var Board = React.createClass({
  render: function(){
    var p = this.props;
    var squares = [];
    _.each(_.range(1,10),function(row){
      _.each(_.range(1,10),function(col){
        squares.push({
          id:"r"+row+"c"+col,
          row: row,
          col: col,
          is: _.random(10) ? undefined : _.random(1,9),
          canBe: {1:_.random(10)>2,2:_.random(10)>2,3:_.random(10)>2,4:_.random(10)>2,5:_.random(10)>2,6:_.random(10)>2,7:_.random(10)>2,8:_.random(10)>2,9:_.random(10)>2}
        });
      });
    });
    var houses = [];
    _.each(_.range(1,10),function(num){
      _.each(["row","col","box"],function(type){
        houses.push({
          type:type,
          num:num,
          id:type+num,
          selected:p.selected[type+num]
        });
      });
    });
    return (
      <div className='board'>
        {houses.map(
          (h) => <House key={h.id} type={h.type} num={h.num} selected={h.selected} />
        )}
        {squares.map(
          (s) => <Square key={s.id} row={s.row} col={s.col} is={s.is} canBe={s.canBe} />
        )}
      </div>
    );
  }
});