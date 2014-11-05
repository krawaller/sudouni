/** @jsx React.DOM */

var Sudoselect = React.createClass({
  render: function(){
    return (
      <div>
        <p>Select a sudoku</p>
        <div className='btn-group'>
          {_.map(sudo.sudos,function(def,key){          
            return <button key={key} className='btn btn-default' onClick={_.partial(actions.selectSudo,key)}>{key}</button>;
          },this) }
        </div>
      </div>
    );
  }
});