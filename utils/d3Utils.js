const d3Utils = () => {
  return {
    renderLegend: (props) => {
      const { g, legendItems, width, z } = props;
      const fontSize = 14;
      const legendKeyDimension = 19;
      const textRightPadding = 24;
      const textTopPadding = 9.5;

      const legend = g.append("g")
          .attr("font-family", "sans-serif")
          .attr("font-size", 14)
          .attr("text-anchor", "end")
        .selectAll("g")
        .data(legendItems)
        .enter().append("g")
          .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      legend.append("rect")
          .attr("x", width - legendKeyDimension)
          .attr("width", legendKeyDimension)
          .attr("height", legendKeyDimension)
          .attr("fill", z);

      legend.append("text")
          .attr("x", width - textRightPadding)
          .attr("y", textTopPadding)
          .attr("dy", "0.32em")
          .text(function(d) {
            return d;
          });
    }
  }
}
