/** @jsx React.DOM */

var Game = React.createClass({
  mixins: [Reflux.listenToMany(actions)],
  componentWillMount: function(){
    this.setState({houses:this.props.houses,squares:this.props.squares});
  },
  getInitialState: function(){
    return {selections:{}};
  },
  onSelectSquare: function(sid){
    var square = this.props.squares[sid];
    this.setState({
      selections: _.object([square.row,square.col,square.box,square.id],[true,true,true,true])
    });
  },
  componentDidMount: function(){
    setTimeout(this.solve,500);
  },
  solve: function(){
    var names = ["flag"]; //Object.keys(sudo.techs);
    for(var tn=0;tn<names.length;tn++){
      var tech = names[tn];
      var solve = sudo.techs[tech].find(this.state.squares,this.state.houses);
      if (solve){
        var instr = sudo.techs[tech].effect(solve,this.state.squares,this.state.houses);
        console.log("FOUND",tech,instr,sudo.showInstructions(instr));
        var updatedsquares = performInstructions(instr,this.state.squares);
        var updatedhouses = sudo.calcHouses(this.state.houses,updatedsquares);
        var selections = sudo.techs[tech].show ? sudo.techs[tech].show(solve,updatedsquares,updatedhouses) : {};
        this.setState({
          selections: _.extend(sudo.showInstructions(instr),selections),
          squares: updatedsquares,
          houses: updatedhouses
        });
        setTimeout(this.solve,3000);
        return;
      }
    }
    console.log("FOUND NOTHING :(");
    this.setState({selections:{}})
  },
  render: function(){
    return (
      <div className='game'>
        <Board squares={this.state.squares} houses={this.state.houses} selections={this.state.selections} />
      </div>
    );
  }
});