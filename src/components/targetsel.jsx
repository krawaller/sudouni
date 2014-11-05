/** @jsx React.DOM */

var Targetselect = React.createClass({
  handleChange: function(event){
  	actions.choseTarget(event.target.value);
  },
  render: function(){
  	var options = _.map(this.props.possibilities||[],function(poss,key){
  	  return (
  	  	<div key={key}>
  	  	  <label>
            <input type="radio" value={key}/><Description description={poss.explanation} />
          </label>
  	  	</div>
  	  );
  	});
    return !this.props.tech ? <p>Select a tech</p> : !this.props.possibilities.length ? <p>Found nothing for {this.props.tech}!</p> : (
      <div>
        <RadioGroup name='targetsel' ref='possgroup' value={this.props.choice} onChange={this.handleChange}>{options}</RadioGroup>
        <button type='button' onClick={actions.performSelectedPossibility}>Perform</button>
      </div>
    );
  }
});