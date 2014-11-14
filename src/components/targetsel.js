/** @jsx React.DOM */

var React = require('react'),
    _ = require('lodash'),
    RadioGroup = require('./radiogroup'),
    actions = require('../actions'),
    Description = require('./description');

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
        <button type='btn btn-default' onClick={actions.performSelectedPossibility}>Perform selected</button>
        {this.props.possibilities.length > 1 ? <button type='btn btn-default' onClick={actions.performAllPossibilities}>Perform all</button> : '' }
        <RadioGroup name='targetsel' ref='possgroup' value={this.props.choice} onChange={this.handleChange}>{options}</RadioGroup>
      </div>
    );
  }
});

module.exports = Targetselect;