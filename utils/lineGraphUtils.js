const lineGraphUtils = () => {
  const parseYear = (yearString) => {
    // if year is already formatted, then just return timeParse of year, else return a parsed version
    if (yearString.toString().length === 4) {
      return d3.timeParse('%Y')(parseInt(yearString));
    }
    // split 2015-16 to 2016
    const laterYear = 2000 + parseInt(yearString.split('-')[1], 10);
    return d3.timeParse('%Y')(laterYear);
  }

  return {
    scaleRanges: (props) => {
      const { data, x, y, yDomainMax } = props;
      x.domain(d3.extent(data, function(d) {
        console.log(d.name);
        return parseYear(d.name);
      }));
      y.domain([0, yDomainMax]);
    },

    renderLine: (props) => {
      const { data, g, x, y, yKey, lineColor } = props;
      const valueline = d3.line()
        .x(function(d) {
          return x(parseYear(d.name));
        })
        .y(function(d) { return y(d[yKey]); });

        // Add the valueline path.
        g.append("path")
          .datum(data)
          .attr("class", "line")
          .style('stroke', lineColor)
          .style('opacity', 0)
          .attr("d", valueline)
          .transition()
          .duration(750)
          .style('opacity', 1);
    }
  }
}
