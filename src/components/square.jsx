/** @jsx React.DOM */

var Square = React.createClass({
  render: function(){
    var classes = ["square width1","height1"];
    classes.push(this.props.row);
    classes.push(this.props.col);
    if(this.props.selected){classes.push("selected");}
    return <div onClick={_.partial(actions.selectSquare,this.props.key)} id={this.props.key} className={classes.join(" ")}>{
      this.props.is ? <div className="answer width9 height9">{this.props.is}</div> : _.filter(_.range(1,10),(c)=>this.props.canBe[c]).map(
        (c) => <div className={"candidate width3 height3 box"+c} key={c}>{c}</div>
      )
    }</div>;
  }
});