(() => {
    const dataSource = "enrollment.json";
    const gradeLevels = ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const svgMargins = {top: 20, right: 20, bottom: 70, left: 80};
    let enrollmentData = [];
    let x;
    let y;
    let g;
    let svg;
    let schoolSelectorWrapper;
    let allSchoolNames = [];
    let width;
    let height;

    const aggregateByGrade = (data) => {
      return gradeLevels.map((grade) => {
        let tally = 0;
        _.forOwn(data, (school) => {
          if (school[grade] !== "") {
            tally += school[grade];
          }
        })
        return { 
          grade: grade,
          tally: tally
         };
      });
    }

    // Takes in data for one school and returns an array of objects that contain info about grade
    const formatSchoolData = (schoolData) => {
      return gradeLevels.map((grade) => {
        const studentsInGrade = schoolData[grade];
        return { grade: grade, tally: studentsInGrade };
      });
    }

    const getSchoolenrollmentData = (schoolName, data) => {
      if (schoolName === 'all') {
        return aggregateByGrade(data);
      } else if (data[schoolName]) {
        return formatSchoolData(data[schoolName]);
      }
      return [];
    }

    // Takes in data for all schools and returns array with just school names
    const getAllSchoolNames = (data) => {
      let allSchoolNames = [];
      _.forOwn(data, (value, key) => {
        allSchoolNames.push(key);
      })

      return allSchoolNames;
    }

    const selectSchool = (event) => {
      console.log(event.target.value);
      // alert('school selected');
      view.renderData(event.target.value, null, enrollmentData);
    }

    // SVG related additions
    const view = {
      initializeSvg: () => {
        svg = d3.select("svg");
        width = +svg.attr("width") - svgMargins.left - svgMargins.right;
        height = +svg.attr("height") - svgMargins.top - svgMargins.bottom;

        x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
        y = d3.scaleLinear().rangeRound([height, 0]);

        g = svg.append("g")
            .attr("transform", "translate(" + svgMargins.left + "," + svgMargins.top + ")")
            .attr("class", "svgWrapper");
      },
      initializeSchoolSelector: (schoolNames) => {
        schoolSelectorWrapper = document.querySelector('#schoolSelector');

        schoolNames.forEach((schoolName) => {
          const option = document.createElement("OPTION");
          option.value = schoolName;
          option.text = schoolName;
          schoolSelectorWrapper.append(option);
        });

        schoolSelectorWrapper.onchange = selectSchool;
      },

      renderXAxis: () => {
        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));
      },

      renderYAxis: () => {
        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y).ticks(5))
      },

      renderBars: (enrollmentPerGrade) => {
        g.selectAll(".bar")
          .data(enrollmentPerGrade)
          .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { 
              return x(d.grade);
            })
            .attr("y", 410)
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .transition()
            .duration(500)
            .attr("height", function(d) { 
              console.log('height', height);
              console.log('y(d.tally)', y(d.tally));
              return height - y(d.tally); 
            })
            .attr("y", function(d) {  
              return y(d.tally); 
            })
        g.selectAll(".hover-text")
          .data(enrollmentPerGrade)
          .enter().append("text")
            .attr("text-anchor", "middle")
            .attr("class", "hover-text")
            .attr("x", (grade) => {
              return x(grade.grade) + x.bandwidth()/2
            })
            .attr("y", 410)
            .text((grade) => {
              return grade.tally;
            })
            .style("fill-opacity", 1)
            .attr("y", (grade) => {
              return y(grade.tally) + 25;
            })
      },

      renderXLabel() {
        g.append("text")
          .attr("x", width / 2)
          .attr("y", 455)
          .style("text-anchor", "middle")
          .text("Grade Level");
      },

      renderYLabel() {
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - (svgMargins.left))
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Number of Students");
      },

      renderData: (schoolName, error, data) => {
        if (error) throw error;

        view.cleanup();
        console.log('enrollmentData', enrollmentData);
        if (enrollmentData.length === 0) {
          enrollmentData = data;
        }

        console.log('schoolName', schoolName);
        const enrollmentPerGrade = getSchoolenrollmentData(schoolName, data);

        console.log('enrollmentPerGrade', enrollmentPerGrade);

        x.domain(gradeLevels.map((gradeLevel) => { return gradeLevel; }));

        if (schoolName === 'all') {
          y.domain([0, d3.max(enrollmentPerGrade, (gradeLevel) => { return gradeLevel.tally; })]);
        } else {
          // Hard coded maximum of 300 / grade level based on looking at the data
          y.domain([0, 300]);
        }

        view.renderXAxis();
        view.renderYAxis();
        view.renderBars(enrollmentPerGrade);
        view.renderXLabel();
        view.renderYLabel();

        // Initialize school selector on first render only
        if (allSchoolNames.length === 0) {
          allSchoolNames = getAllSchoolNames(data);
          view.initializeSchoolSelector(allSchoolNames);
        }
      },

      cleanup() {
        const svgWrapper = document.querySelector(".svgWrapper");
        svgWrapper.innerHTML = '';
      },

      renderSchoolSelect() {

      }
    }

    view.initializeSvg();
    // Initialize table with all charter schools
    // @params (this, schoolName)
    d3.json(dataSource, view.renderData.bind(this, 'all'));
      
})();