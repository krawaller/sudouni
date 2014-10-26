/** @jsx React.DOM */

var Board = React.createClass({
  render: function(){
    return (
      <div className='board'>
        {_.map(this.props.houses,
          (h) => <House key={h.id} type={h.type} num={h.num} selected={h.selected} />
        )}
        {_.map(this.props.squares,
          (s) => <Square key={s.id} row={s.row} col={s.col} is={s.is} canBe={s.canBe} />
        )}
      </div>
    );
  }
});