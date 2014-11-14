/** @jsx React.DOM */

var React = require('react'),
    _ = require('lodash'),
    actions = require('../actions'),
    Reflux = require('reflux'),
    Game = require('./game'),
    Manipulation = require('./manipulation'),
    Sudoselect = require('./sudosel'),
    sudo = require('../sudo');

var Menu = React.createClass({
  mixins: [Reflux.connect(actions.selectSudo,"sudoname"),Reflux.connect(actions.startPlaying,"sudodef"),Reflux.listenToMany(actions)],
  onReturnToMenu: function(){
  	this.setState({sudoname:undefined,sudodef:undefined});
  },
  render: function(){
    return this.state && this.state.sudoname ? (
      <div>
        <span>Chose sudoku {this.state.sudoname}</span> <button onClick={actions.returnToMenu}>Back to menu</button>
		{this.state.sudodef ? <Game sudo={this.state.sudodef} /> : <Manipulation sudodef={_.cloneDeep(sudo.sudos[this.state.sudoname])} />}
      </div>
    ) : (
      <Sudoselect />
    );
  }
});

module.exports = Menu;