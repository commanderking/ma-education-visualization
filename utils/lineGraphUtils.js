const lineGraphUtils = () => {
  const parseYear = (yearString) => {
    return d3.timeParse('%Y')(parseInt(yearString.split('-')[0], 10));
  }

  return {
    scaleRanges: (props) => {
      const { data, x, y, yDomainMax } = props;
      x.domain(d3.extent(data, function(d) {
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
