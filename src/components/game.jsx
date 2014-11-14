/** @jsx React.DOM */

var Game = React.createClass({
  mixins: [Reflux.listenToMany(actions)],
  getInitialState: function(){
    return {
      selections:{},
      possibilities:[],
      d: calculateStartingData(this.props.sudo)
    };
  },
  onPerformSelectedPossibility: function(){
    this.setState({
      d: sudo.performEffectsOnData(this.state.d,this.state.possibilities[this.state.targetchoice].effect),
      currenttech: undefined,
      possibilities: []
    });
    setTimeout(_.bind(function(){
      this.setState({selections:{}});
    },this),500);
  },
  onPerformAllPossibilities: function(){
    this.setState({
      d: _.reduce(this.state.possibilities,function(memo,poss){ return sudo.performEffectsOnData(memo,poss.effect);},this.state.d),
      currenttech: undefined,
      possibilities: [],
      selections: {}
    });
  },
  onChoseTarget: function(i){
    this.setState({
      targetchoice: i,
      selections:this.state.possibilities[i].selections
    });
  },
  onSelectTech: function(tech){
    var possibilities = _.map([].concat(sudo.techs[tech].find(this.state.d)||[]),function(input){
      var effect = (sudo.techs[tech].effect || sudo.inferInputEffects)(input,this.state.d);
      return {
        input: input,
        effect: effect,
        explanation: sudo.techs[tech].describe(input),
        selections: _.extend(sudo.inferInputHighlights(input), sudo.inferEffectHighlights(effect))
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
        <Board squares={this.state.d.squares} houses={this.state.d.houses} selections={this.state.selections} />
        <Techselect currenttech={this.state.currenttech} />
        <Targetselect tech={this.state.currenttech} possibilities={this.state.possibilities} choice={this.state.targetchoice} />
      </div>
    );
  }
});