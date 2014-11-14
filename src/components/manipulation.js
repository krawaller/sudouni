/** @jsx React.DOM */

var React = require('react'),
    _ = require('lodash'),
    actions = require('../actions'),
    Reflux = require('reflux'),
    Board = require('./board'),
    sudo = require('../sudo');

var Manipulation = React.createClass({
  onClick: function(){
    actions.startPlaying(this.state.sudodef);
  },
  componentWillMount: function(){
    this.setState({sudodef:this.props.sudodef});
  },
  scramble: function(name){
    this.setState({sudodef: sudo.scrambles[name](this.state.sudodef)});
  },
  render: function(){
    var squares = sudo.performEffects(sudo.setupToInstructions(this.state.sudodef),_.cloneDeep(sudo.squares));
    return (
      <div>
        <Board nocands={true} squares={squares} houses={sudo.houses} selections={{}} />
        <div className="btn-group">
          <button className="btn btn-default" onClick={_.partial(this.scramble,"scrambleNumbers")}>Scramble numbers</button>
          <button className="btn btn-default" onClick={_.partial(this.scramble,"swapRowTriples")}>Swap row triples</button>
          <button className="btn btn-default" onClick={_.partial(this.scramble,"swapColumnTriples")}>Swap column triples</button>
          <button className="btn btn-default" onClick={_.partial(this.scramble,"shuffleRowTriples")}>Shuffle row triples</button>
          <button className="btn btn-default" onClick={_.partial(this.scramble,"shuffleColumnTriples")}>Shuffle column triples</button>
          <button className="btn btn-submit" onClick={this.onClick}>Start playing!</button>
        </div>
      </div>
    );
  }
});

module.exports = Manipulation;