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
    return <div className='container'>{ this.state && this.state.sudoname ? (
      <div>
        <div className='row'>
          <div className='col-md-12'>
            <span>Chose sudoku {this.state.sudoname}</span> <button onClick={actions.returnToMenu}>Back to menu</button>
          </div>
        </div>
        <div className='row'>
          <div className='col-md-12'>
		{this.state.sudodef ? <Game sudo={this.state.sudodef} /> : <Manipulation sudodef={_.cloneDeep(sudo.sudos[this.state.sudoname])} />}
          </div>
        </div>
      </div>
    ) : (
      <Sudoselect />
    ) }</div>;
  }
});

module.exports = Menu;