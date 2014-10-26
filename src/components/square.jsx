/** @jsx React.DOM */

var Square = React.createClass({
  catchClick: function(){
    console.log("CLICKED",this.props.key);
  },
  render: function(){
    var classes = ["square width1","height1"];
    classes.push(this.props.row);
    classes.push(this.props.col);
    return <div onClick={this.catchClick} id={this.props.key} className={classes.join(" ")}>{
      this.props.is ? <div className="answer width9 height9">{this.props.is}</div> : _.filter(_.range(1,10),(c)=>this.props.canBe[c]).map(
        (c) => <div className={"candidate width3 height3 box"+c} key={c}>{c}</div>
      )
    }</div>;
  }
});