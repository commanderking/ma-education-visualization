(() => {
    const dataSource = "data.json";
    const disciplineConsts = {
      STUDENTS: 'Students',
      STUDENTS_DISCIPLINED: 'Students Disciplined',
      IN_SCHOOL_SUSPENSION: '# In-School Suspension',
      OUT_SCHOOL_SUSPENSION: '# Out-of-School Suspension',
      EXPULSION: '# Expulsion',
      REMOVED_TO_ALTERNATE: '# Removed to Alternate Setting',
      EMERGENCY_REMOVAL: '# Emergency Removal',
    }

    const keyConstants = {
      CHARTER_SCHOOLS: "Charter Schools",
      TRADITIONAL_PUBLIC_SCHOOLS: "Traditional Public",
    }

    const colorMap = {
      [keyConstants.TRADITIONAL_PUBLIC_SCHOOLS]: "#98abc5",
      [keyConstants.CHARTER_SCHOOLS]: "#8a89a6"
    }

    const svgMargins = {top: 20, right: 20, bottom: 70, left: 80};
    let x0;
    let x1;
    let y;
    let z;
    let g;
    let svg;
    let schoolSelectorWrapper;
    let allSchoolNames = [];
    let width;
    let height;
    let currentCategories = ["discipline"];
    let keys = [keyConstants.TRADITIONAL_PUBLIC_SCHOOLS, keyConstants.CHARTER_SCHOOLS]

    let model = {};

    const filterByDistrictType = (data, schoolType) => {
      const schools = data.filter((school) => {
        return school["School Type"] === schoolType;
      });

      console.log('filterByDistrictType', schoolType);
      console.log(schools);
      return schools;
    }

    const filterByYear = (data, year) => {
      return data.filter((district) => {
        return district["Year"] === year;
      });
    }

    const filterByStudentType = (data, studentType) => {
      return data.filter((district) => {
        return district["Subgroup"] === studentType;
      })
    }

    // Takes all charter school entries, sums up data, and creates new object with select properties summed
    const sumCharterSchools = (data) => {
      const charterSummaryData = {
        schoolType: 'Charter',
        districtName: 'Boston Charter Schools',
        [disciplineConsts.STUDENTS]: 0,
        [disciplineConsts.STUDENTS_DISCIPLINED]: 0,
        [disciplineConsts.IN_SCHOOL_SUSPENSION]: 0,
        [disciplineConsts.OUT_SCHOOL_SUSPENSION]: 0,
        [disciplineConsts.EXPULSION]: 0,
        [disciplineConsts.REMOVED_TO_ALTERNATE]: 0,
        [disciplineConsts.EMERGENCY_REMOVAL]: 0
      }

      data.forEach((school) => {
        charterSummaryData[disciplineConsts.STUDENTS] += school[disciplineConsts.STUDENTS] || 0;
        charterSummaryData[disciplineConsts.STUDENTS_DISCIPLINED] += school[disciplineConsts.STUDENTS_DISCIPLINED] || 0;
        charterSummaryData[disciplineConsts.IN_SCHOOL_SUSPENSION] += school[disciplineConsts.IN_SCHOOL_SUSPENSION] || 0;
        charterSummaryData[disciplineConsts.OUT_SCHOOL_SUSPENSION] += school[disciplineConsts.OUT_SCHOOL_SUSPENSION] || 0;
        charterSummaryData[disciplineConsts.EXPULSION] += school[disciplineConsts.EXPULSION] || 0;
        charterSummaryData[disciplineConsts.REMOVED_TO_ALTERNATE] += school[disciplineConsts.REMOVED_TO_ALTERNATE] || 0;
        charterSummaryData[disciplineConsts.EMERGENCY_REMOVAL] += school[disciplineConsts.EMERGENCY_REMOVAL] || 0;
      });

      return charterSummaryData;
    }

    const createCategoryData = (charterData, traditionalData, category) => {
      return {
        name: category,
        [keyConstants.CHARTER_SCHOOLS]: charterData[category] / charterData[disciplineConsts.STUDENTS],
        [keyConstants.TRADITIONAL_PUBLIC_SCHOOLS]: traditionalData[category] / traditionalData[disciplineConsts.STUDENTS]
      }
    }

    // Creates final data structure before feeding into d3
    const createProcessedData = (charterData, traditionalData, categoriesArray) => {
      const processedData = categoriesArray.map((category) => {
        return createCategoryData(charterData, traditionalData, category);
      });

      return processedData;
    };

    // SVG related additions
    const view = {
      initializeSvg: () => {
          svg = d3.select("svg"),
          margin = {top: 20, right: 20, bottom: 30, left: 100},
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom,
          g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      },

      setScales: () => {
        x0 = d3.scaleBand()
            .rangeRound([50, width - 150])
            .paddingInner(0.01);

        x1 = d3.scaleBand()
            .padding(0);

        y = d3.scaleLinear()
            .rangeRound([height, 0]);

        z = d3.scaleOrdinal()
            .range(
              [colorMap[keyConstants.TRADITIONAL_PUBLIC_SCHOOLS], colorMap[keyConstants.CHARTER_SCHOOLS]]);
      },

      renderAxes: () => {
        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x0));

        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y).ticks(5, '%'))

      },

      renderLegend: () => {
        const legend = g.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 14)
            .attr("text-anchor", "end")
          .selectAll("g")
          .data(keys.reverse())
          .enter().append("g")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
            .attr("x", width - 19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", z);

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(function(d) { 
              return d; 
            });
      },

      renderYLabel: () => {
        g.append("text")
            .attr("class", "label-y")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - (svgMargins.left))
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("% Students Disciplined");
      },

      renderBars: (data) => {
        g.append("g")
          .selectAll("g")
          .data(data)
          .enter().append("g")
            .attr("transform", function(d) { 
              return "translate(" + x0(d.name) + ",0)"; 
            })
          .selectAll("rect")
          .data(function(d) { 
            const retval = keys.map(function(key) { 
              return {key: key, value: d[key]}; 
            });
            return retval;
          })
          .enter().append("rect")
            .attr("x", function(d) { 
              return x1(d.key); 
            })
            .attr("y", function(d) { 
              return y(d.value); 
            })
            .attr("width", x1.bandwidth())
            .attr("height", function(d) { return height - y(d.value); })
            .attr("fill", function(d) { 
              return z(d.key); 
            });
      },

      renderData: (data) => {
        console.log(data)
        view.initializeSvg();
        view.setScales();

        // Manipulating data to get 2015 all student data
        const allStudentsData = filterByStudentType(data, 'All');
        const studentFifteenData = filterByYear(allStudentsData, "2015-16");
        const charterSchools = filterByDistrictType(studentFifteenData, 'Charter');
        const charterSummaryData = sumCharterSchools(charterSchools);
        const publicDistrictSummaryData = filterByDistrictType(studentFifteenData, 'Traditional District');
        const processedData = createProcessedData(charterSummaryData, publicDistrictSummaryData[0], [disciplineConsts.STUDENTS_DISCIPLINED]);

        // Creates label for category on x-axis
        x0.domain(processedData.map(category => category.name));
        x1.domain(keys).rangeRound([0, x0.bandwidth()]);
        y.domain([0, .25]);

        view.renderAxes();
        view.renderYLabel();
        view.renderBars(processedData);
        view.renderLegend();
      }
    }

    // Append legend

    // Initialize table with all charter schools
    // @params (this, schoolName)
    d3.json(dataSource, view.renderData);
      
})();