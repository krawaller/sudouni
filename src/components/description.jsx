/** @jsx React.DOM */

var Description = React.createClass({
  render: function(){
    return (
      <span className="desc">
        {_.map(this.props.description,function(part){
          if (typeof part === "string"){
            return <span>{part}</span>;
          } else if (part.sid){
            return <span className={"square "+(part.c||"used")}>{part.sid}</span>;
          } else if (part.cand){
            return <span className="cand">{part.cand}</span>;
          } else if (part.sids){
            return part.sids.map(function(sid){
              return <span className={"square "+(part.c||"used")}>{sid}</span>;
            });
          } else if (part.hid){
            return <span className={"house "+(part.c||"used")}>{part.hid}</span>
          } else if (part.hids){
            return part.hids.map(function(hid){
              return <span className={"house "+(part.c||"used")}>{hid}</span>;
            });
          } else if (part.cands){
            return part.cands.map(function(cand){
              return <span className="cand">{cand}</span>;
            });
          }
        })}
      </span>
    );
  }
});