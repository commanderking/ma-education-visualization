const barGraphUtils = () => {
  return {
    renderBarsWrapper: (data, g) => {
      // element that wraps all the bars in the graph
      const barsWrapper = g.append("g")
        .attr('class', 'gWrapper')
        .selectAll("g")
        .data(data, (d) => {
          return d.name;
        });
      return barsWrapper;
    },
    renderBarGroups: (barsProps) => {
      const { barsWrapper, x0, keys } = barsProps;
      return barsWrapper
        .enter().append("g")
          .attr("transform", function(d) {
            return "translate(" + x0(d.name) + ",0)";
          })
          .attr('class', 'barGroup')
          .selectAll("rect")
          .data(function(d) {
            return retval = keys.map(function(key) {
              return {key: key, value: d[key]};
            });
          })
    },
    renderRects: (barProps) => {
      const { barsGroup, x1, y, z, height } = barProps;
      barsGroup.enter().append("rect")
        .attr("y", height)
        .attr("x", function(d) {
          // console.log(d);
          return x1(d.key);
        })
        .transition()
        .duration(750)
        .attr("y", function(d) {
          return y(d.value);
        })
        .attr("width", x1.bandwidth())
        .attr("height", function(d) { return height - y(d.value); })
        .attr("fill", function(d) {
          return z(d.key);
        })
    },
    renderBarsText: (props) => {
      const { barsGroup, x1, y, height } = props;
      barsGroup.enter().append('text')
        .attr("y", (d) => {
          if (d.value * 100 > 3) {
            return y(d.value) + 20; // TODO: move added value to constant
          } else {
            return height - 2;
          }
        })
        .attr('x', (d) => {
          return x1(d.key) + x1.bandwidth()/2 -20;
        })
        .text((d) => {
          // Only show text if value is higher than 0
          if (d.value) {
            return `${(d.value* 100).toFixed(1)}%`;
          }          })
        .style('opacity', 0)
        .transition()
        .delay(750)
        .duration(1500)
        .style('opacity', 100)
    }
  }
}
