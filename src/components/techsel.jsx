/** @jsx React.DOM */

var Techselect = React.createClass({
  render: function(){
    return (
      <div className='btn-group'>
        {_.map(sudo.techs,function(def,key){          
          return <button key={key} className={'btn btn-default'+(this.props.currenttech===key?' active':'')} onClick={_.partial(actions.selectTech,key)}>{key}</button>;
        },this) }
      </div>
    );
  }
});