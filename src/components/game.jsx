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
  onFindtech: function(){
    var names = Object.keys(sudo.techs); // ["alternatepair"];//
    for(var tn=0;tn<names.length;tn++){
      var tech = names[tn];
      var solve = sudo.techs[tech].find(this.state.squares,this.state.houses);
      if (solve){
        var instr = (sudo.techs[tech].effect || sudo.inferSolveInstructions)(solve,this.state.squares,this.state.houses);
        console.log("FOUND",tech,solve,instr);
        var selections = _.extend(sudo.inferSolveHighlights(solve), sudo.techs[tech].show ? sudo.techs[tech].show(solve,squares,houses) : {} );
        this.setState({
          selections: _.extend(sudo.showInstructions(instr),selections),
          instr: instr,
          desc: sudo.techs[tech].describe(solve)
        });
        return;
      }
    }
    console.log("FOUND NOTHING :(");
    this.setState({selections:{}})
  },
  onConfirmtech: function(){
    var updatedsquares = performInstructions(this.state.instr,this.state.squares);
    var updatedhouses = sudo.calcHouses(this.state.houses,updatedsquares);
    this.setState({
      instr: undefined,
      desc: [],
      selections: {},
      houses: updatedhouses,
      squares: updatedsquares
    });
  },
  render: function(){
    return (
      <div className='game'>
        <Board squares={this.state.squares} houses={this.state.houses} selections={this.state.selections} />
        <Console desc={this.state.desc||[]} confirm={!!this.state.instr} />
      </div>
    );
  }
});