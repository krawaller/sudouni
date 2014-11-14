/** @jsx React.DOM */

var Board = React.createClass({
  render: function(){
    return (
      <div className='board'>
        {_.map(this.props.houses,
          (h) => <House key={h.id} type={h.type} num={h.num} selected={this.props.selections[h.id]} />
        )}
        {_.map(this.props.squares,
          (s) => <Square key={s.id} row={s.row} col={s.col} is={s.is} canBe={s.canBe} selected={this.props.selections[s.id]} selectedcands={this.props.selections[s.id+"cands"]} />
        )}
      </div>
    );
  }
});