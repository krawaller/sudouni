/** @jsx React.DOM */

var Menu = React.createClass({
  mixins: [Reflux.connect(actions.selectSudo,"sudoname"),Reflux.listenToMany(actions)],
  onReturnToMenu: function(){
  	this.setState({sudoname:undefined});
  },
  render: function(){
    return this.state && this.state.sudoname ? (
      <div>
        <span>Playing sudoku {this.state.sudoname}</span> <button onClick={actions.returnToMenu}>Back to menu</button>
        <Game sudo={sudo.sudos[this.state.sudoname]} />
      </div>
    ) : (
      <Sudoselect />
    );
  }
});