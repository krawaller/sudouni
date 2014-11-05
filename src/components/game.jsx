/** @jsx React.DOM */

var Game = React.createClass({
  mixins: [Reflux.listenToMany(actions)],
  getInitialState: function(){
    var squares = sudo.performInstructions(sudo.setupToInstructions(this.props.sudo),_.cloneDeep(sudo.squares));
    return {
      selections:{},
      possibilities:[],
      squares: squares,
      houses: sudo.calcHouses(_.cloneDeep(sudo.houses),squares)
    };
  },
  /*onSelectSquare: function(sid){
    var square = this.props.squares[sid];
    this.setState({
      selections: _.object([square.row,square.col,square.box,square.id],[true,true,true,true])
    });
  },*/
  onPerformSelectedPossibility: function(){
    var updatedsquares = sudo.performInstructions(this.state.possibilities[this.state.targetchoice].effect,this.state.squares);
    var updatedhouses = sudo.calcHouses(this.state.houses,updatedsquares);
    this.setState({
      selections: {},
      houses: updatedhouses,
      squares: updatedsquares,
      currenttech: undefined,
      possibilities: []
    });
  },
  onChoseTarget: function(i){
    this.setState({
      targetchoice: i,
      selections:this.state.possibilities[i].selections
    });
  },
  onSelectTech: function(tech){
    var possibilities = _.map([].concat(sudo.techs[tech].find(this.state.squares,this.state.houses)||[]),function(input){
      var effect = (sudo.techs[tech].effect || sudo.inferSolveInstructions)(input,this.state.squares,this.state.houses);
      return {
        input: input,
        effect: effect,
        explanation: sudo.techs[tech].describe(input),
        selections: _.extend(sudo.inferSolveHighlights(input), sudo.techs[tech].show ? sudo.techs[tech].show(input,squares,houses) : {} ,sudo.showInstructions(effect))
      }
    },this);
    this.setState({
      currenttech: tech,
      possibilities: possibilities,
      selections: possibilities.length ? possibilities[0].selections : {},
      targetchoice: 0
    });
  },
  render: function(){
    return (
      <div className='game'>
        <Board squares={this.state.squares} houses={this.state.houses} selections={this.state.selections} />
        <Techselect currenttech={this.state.currenttech} />
        <Targetselect tech={this.state.currenttech} possibilities={this.state.possibilities} choice={this.state.targetchoice} />
      </div>
    );
  }
});