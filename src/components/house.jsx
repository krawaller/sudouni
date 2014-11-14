/** @jsx React.DOM */

var House = React.createClass({
  render: function(){
  	var p = this.props, classes;
  	switch(p.type){
  	  case "box": classes = ["house",p.type,p.key,"width3","height3"]; break;
  	  case "row": classes = ["house",p.type,p.key,"col1","width9","height1"]; break;
  	  case "col": classes = ["house",p.type,p.key,"row1","width1","height9"]; break;
  	}
  	if(this.props.selected){classes.push(this.props.selected);}
    return <div className={classes.join(" ")}></div>
  }
});