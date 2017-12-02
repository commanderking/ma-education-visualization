(() => {
  // filterUtils defined in html file
  const {filterByDistrictType, filterByYear, filterByStudentType, filterBySubject } = filterUtils;

    const dataSource = "data.json";

    const subgroupConsts = {
      ALL: 'All',
      BLACK: 'Black',
      HISPANIC: 'Hispanic',
      ELL: 'ELL',
      SWD: 'SWD'
    }

    const subjectConstants = {
      ELA: 'ELA',
      MATH: 'MTH',
      SCIENCE: 'SCI'
    }

    const mcasConstants = {
      STUDENTS_COUNT: 'Student Included',
      PROFICIENT_ADVANCED: 'P+A #',
      ADVANCED: 'A #',
      PROFICIENT: 'P #',
      NEEDS_IMPROVEMENT: 'NI #',
      WARNING_FAIL: 'W/F #',
      CPI: 'CPI'
    }

    const mapMcasConstantsToLabel = {
      [mcasConstants.PROFICIENT_ADVANCED]: 'Proficient and Advanced',
      [mcasConstants.ADVANCED]: 'Advanced',
      [mcasConstants.PROFICIENT]: 'Proficient',
      [mcasConstants.NEEDS_IMPROVEMENT]: 'Needs Improvement',
      [mcasConstants.WARNING_FAIL]: 'Warning or Failure',
      [mcasConstants.CPI]: 'CPI'
    }

    const filterViews = {
      OVERVIEW: 'overview',
      DETAIL: 'detail',
      BREAKDOWN_RACE: 'breakdownByRace',
      TRENDS: 'trends'
    }

    const districtConstants = {
      CHARTER_SCHOOLS: "Charter",
      TRADITIONAL_PUBLIC_SCHOOLS: "Traditional District",
    }

    const colorMap = {
      [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]: "#98abc5",
      [districtConstants.CHARTER_SCHOOLS]: "#8a89a6"
    }

    // Svg related Constants
    const svgMargins = {top: 20, right: 20, bottom: 70, left: 80};
    const yDomainMax = 0.8; // Max % for y-axis label
    let x0;
    let x1;
    let y;
    let z;
    let g;
    let svg;
    let width;
    let height;
    let keys = [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS, districtConstants.CHARTER_SCHOOLS]

    let loadedData = [];

    // Based on action passed in, will filter
    const filterController = (action, payload, data) => {
      switch(action) {
        case filterViews.OVERVIEW:
          return filterForOverview(payload, data);
        case filterViews.DETAIL:
          return filterForOverview(payload, data);
        case filterViews.BREAKDOWN_RACE:
          return filterForRaceView(payload, data);
          case filterViews.TRENDS:
            return filterForTrends(payload, data)
        default:
          return [];
      }
    }

    const filterForOverview = (payload, data) => {
        // Manipulating data to get 2015 all student data
        const allStudentsData = filterByStudentType(data, payload.studentSubgroup);
        const studentDataForYear = filterByYear(allStudentsData, payload.year);
        const studentsForSubject = filterBySubject(studentDataForYear, payload.subject);
        const charterSchools = filterByDistrictType(studentsForSubject, 'Charter');
        console.log(studentsForSubject);
        const charterSummaryData = sumCharterSchools(charterSchools);
        const publicDistrictSummaryData = filterByDistrictType(studentsForSubject, 'Traditional District');
        console.log(publicDistrictSummaryData);
        const processedData = createProcessedData(
          charterSummaryData,
          publicDistrictSummaryData[0],
          payload.mcasConstants
        );
        return processedData;
    }
    const sumCharterSchools = (data) => {
      const charterSummaryData = {
        schoolType: 'Charter',
        districtName: 'Boston Charter Schools',
        [mcasConstants.STUDENTS_COUNT]: 0,
        [mcasConstants.PROFICIENT_ADVANCED]: 0,
        [mcasConstants.ADVANCED]: 0,
        [mcasConstants.PROFICIENT]: 0,
        [mcasConstants.NEEDS_IMPROVEMENT]: 0,
        [mcasConstants.WARNING_FAIL]: 0,
        [mcasConstants.CPI]: 0
      }

      data.forEach((school) => {
        charterSummaryData[mcasConstants.STUDENTS_COUNT] += school[mcasConstants.STUDENTS_COUNT] || 0;
        charterSummaryData[mcasConstants.PROFICIENT_ADVANCED] += school[mcasConstants.PROFICIENT_ADVANCED] || 0;
        charterSummaryData[mcasConstants.ADVANCED] += school[mcasConstants.ADVANCED] || 0;
        charterSummaryData[mcasConstants.PROFICIENT] += school[mcasConstants.PROFICIENT] || 0;
        charterSummaryData[mcasConstants.NEEDS_IMPROVEMENT] += school[mcasConstants.NEEDS_IMPROVEMENT] || 0;
        charterSummaryData[mcasConstants.WARNING_FAIL] += school[mcasConstants.WARNING_FAIL] || 0;
        charterSummaryData[mcasConstants.CPI] += school[mcasConstants.CPI] || 0;

      });

      return charterSummaryData;
    }

    const createCategoryData = (charterData, traditionalData, category) => {
        return {
        name: category,
        [districtConstants.CHARTER_SCHOOLS]: charterData[category] / charterData[mcasConstants.STUDENTS_COUNT],
        [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]: traditionalData[category] / traditionalData[mcasConstants.STUDENTS_COUNT]
      }
    }

    // Creates final data structure before feeding into d3
    const createProcessedData = (charterData, traditionalData, categoriesArray) => {
      const processedData = categoriesArray.map((category) => {
        return createCategoryData(charterData, traditionalData, category);
      });

      return processedData;
    };

    const renderOverviewData = (subject) => {
      view.renderData(
        filterViews.OVERVIEW,
        {
          studentSubgroup: subgroupConsts.ALL,
          year: 2013,
          subject: subject,
          mcasConstants: [
            mcasConstants.PROFICIENT_ADVANCED
          ]
        },
        loadedData
      );
    }

    const renderDetailsData = (filters) => {
      console.log(filters);
      view.renderData(
        filterViews.DETAIL,
        {
          studentSubgroup: filters.studentSubgroup || subgroupConsts.ALL,
          year: 2013,
          subject: filters.subject || filters.ELA,
          mcasConstants: [
            mcasConstants.ADVANCED,
            mcasConstants.PROFICIENT,
            mcasConstants.NEEDS_IMPROVEMENT,
            mcasConstants.WARNING_FAIL
          ]
        },
        loadedData
      );
    }

    const renderBreakdownDataByRace = (filters) => {
      view.renderData(
        filterViews.BREAKDOWN_RACE,
        { year: 2013,
          races: [subgroupConsts.BLACK, subgroupConsts.HISPANIC, subgroupConsts.ELL, subgroupConsts.SWD],
          subject: filters.subject
        },
        loadedData
      )
    }

    const renderTrends = (filters) => {
      console.log(filters.subject);
      view.renderData(
        filterViews.TRENDS,
        {
          studentSubgroup: 'All',
          subject: filters.subject
        },
        loadedData
      )
    }

    // Race view shows general discipline statistics
    const filterForRaceView = (payload, data) => {
      const studentDataForYear = filterByYear(data, payload.year);
      const studentDataForSubject = filterBySubject(studentDataForYear, payload.subject)
      return payload.races.map(race => {
        return formatCharterPublicDataForRace(studentDataForSubject, race);
      });
    }

    const formatCharterPublicDataForRace = (data, race) => {
      console.log(race);
      const dataForRace = filterByStudentType(data, race);

      console.log('dataForRace', dataForRace);
      const charterSchools = filterByDistrictType(dataForRace, 'Charter');
      const charterBlackStudentData = sumCharterSchools(charterSchools);
      const publicBlackStudentData = filterByDistrictType(dataForRace, 'Traditional District')[0];

      console.log('charterBlackStudentData', charterBlackStudentData);
      console.log('publicBlackStudentData', publicBlackStudentData);

      const charterPublicBreakdownForRace = createRaceAchievementData(charterBlackStudentData, publicBlackStudentData, race);
      console.log(charterPublicBreakdownForRace);
      return charterPublicBreakdownForRace;
    }

    const createRaceAchievementData = (charterData, traditionalData, race) => {
      return {
        name: race,
        [districtConstants.CHARTER_SCHOOLS]: calculateFractionProficientAdvanced(charterData),
        [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]: calculateFractionProficientAdvanced(traditionalData)
      }
    }

    const calculateFractionProficientAdvanced = (schoolData) => {
      return schoolData[mcasConstants.PROFICIENT_ADVANCED] / schoolData[mcasConstants.STUDENTS_COUNT];
    }

    filterForTrends = (payload, data) => {
      console.log('filtering for trends');
      console.log(payload);
      const allStudentsData = filterByStudentType(data, payload.studentSubgroup);
      const allStudentsForSubject = filterBySubject(allStudentsData, payload.subject);

      console.log(allStudentsForSubject);
      const years = [2011, 2012, 2013, 2014];

      const districtsGroupedByYear = years.map((year) => {
        return allStudentsForSubject.filter((district) => {
          return district[filterConstants.YEAR] === year;
        });
      })

      console.log(districtsGroupedByYear);

      const yearlySummary = districtsGroupedByYear.map((districtsInYear) => {
        const charterSchools = filterByDistrictType(districtsInYear, districtConstants.CHARTER_SCHOOLS);
        const charterSummaryData = sumCharterSchools(charterSchools);
        const publicDistrictSummaryData = filterByDistrictType(districtsInYear, districtConstants.TRADITIONAL_PUBLIC_SCHOOLS)[0];

        return {
          name: districtsInYear[0][filterConstants.YEAR],
          [districtConstants.CHARTER_SCHOOLS]: calculateFractionProficientAdvanced(charterSummaryData),
          [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]: calculateFractionProficientAdvanced(publicDistrictSummaryData)
        };
      });
      return yearlySummary;
    };

    const view = {
      renderButtonGroups: () => {
        const buttonGroupWrapper = document.getElementsByClassName('btn-group-wrapper')[0];
        if (buttonGroupWrapper) {
          const buttonNames = [
            {
              name: 'ELA - Overview',
              onClick: () => {
                renderOverviewData(subjectConstants.ELA)
              }
            },
            {
              name: 'ELA - Details',
              onClick: () => {
                renderDetailsData({
                  subject: subjectConstants.ELA,
                  studentSubgroup: subgroupConsts.ALL
                })
              }
            },
            {
              name: 'ELA - By Subgroup',
              onClick: () => {
                renderBreakdownDataByRace({
                  subject: subjectConstants.ELA
                })
              }
            },
            {
              name: 'ELA - Trends',
              onClick: () => {
                renderTrends({
                  subject: subjectConstants.ELA
                })
              }
            },
            {
              name: 'Math - Overview',
              onClick: () => {
                renderOverviewData(subjectConstants.MATH)
              }
            },
            {
              name: 'Math - Details',
              onClick: () => {
                renderDetailsData({
                  subject: subjectConstants.MATH,
                  studentSubgroup: subgroupConsts.ALL
                })
              }
            },
            {
              name: 'Math - By Subgroup',
              onClick: () => {
                renderBreakdownDataByRace({
                  subject: subjectConstants.MATH
                })
              }
            },
            {
              name: 'Math - Trends',
              onClick: () => {
                renderTrends({
                  subject: subjectConstants.MATH
                })
              }
            },
          ];

          const buttonGroup = document.createElement('div');
          buttonGroup.className = 'btn-group';
          buttonGroup.setAttribute('role', 'group');
          buttonGroup.setAttribute('aria-label', 'Basic example');

          buttonGroupWrapper.append(buttonGroup);

          buttonNames.forEach((option) => {
            console.log(option.onClick);
           const button = document.createElement('button');
            button.className = 'btn btn-secondary';
            button.setAttribute('type', 'button');
            button.innerHTML = option.name;
            button.addEventListener('click', option.onClick);
            buttonGroup.append(button);
          });
        }
      },

      initializeSvg: () => {
          svg = d3.select("svg"),
          margin = {top: 20, right: 20, bottom: 30, left: 100},
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom,
          g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      },

      setBarGraphScales: () => {
        x0 = d3.scaleBand()
            .rangeRound([50, width - 150])
            .paddingInner(0.05);

        x1 = d3.scaleBand()
            .padding(0);

        y = d3.scaleLinear()
            .rangeRound([height, 0]);

        z = d3.scaleOrdinal()
            .range(
              [colorMap[districtConstants.TRADITIONAL_PUBLIC_SCHOOLS], colorMap[districtConstants.CHARTER_SCHOOLS]]);
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
          .data(keys)
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
            .text("% Students");
      },

      renderBars: (data) => {
        const gWrapper = g.append("g")
          .attr('class', 'gWrapper')
          .selectAll("g")
          .data(data, (d) => {
            return d.name;
          });

        gWrapper.enter().append("g")
          .attr("transform", function(d) {
            return "translate(" + x0(d.name) + ",0)";
          })
          .attr('class', 'barGroup')
          .selectAll("rect")
          .data(function(d) {
            const retval = keys.map(function(key) {
              return {key: key, value: d[key]};
            });
            return retval;
          })
          .enter().append("rect")
            .attr("y", 450)
            .attr("x", function(d) {
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
            });
        gWrapper.exit().remove();
      },

      /**
        * Data Action allows for filtering for particular slices of data
        */
      renderData: (filterView, payload, data) => {
        g.selectAll('*').remove();
        if (!loadedData.length) {
          loadedData = data;
        }

        const processedData = filterController(filterView, payload, data);
        console.log(filterView);

        if (filterView === filterView.TRENDS) {
        } else {
          x0.domain(processedData.map(category => {
            console.log(category.name);
            console.log(mapMcasConstantsToLabel[category.name]);
            return category.name;
          }));
          x1.domain(keys).rangeRound([0, x0.bandwidth()]);
          y.domain([0, yDomainMax]);

          view.renderAxes();
          view.renderYLabel();
          view.renderBars(processedData);
          view.renderLegend();
        }


      },
      initialize: (filterView, payload, data) => {
        if (!loadedData.length) {
          loadedData = data;
        }

        view.initializeSvg();
        view.setBarGraphScales();

        const processedData = filterController(filterView, payload, data);

        // filterForBreakdownRace(data);
        // Creates label for category on x-axis
        x0.domain(processedData.map(category => category.name));
        x1.domain(keys).rangeRound([0, x0.bandwidth()]);
        y.domain([0, yDomainMax]);

        view.renderAxes();
        view.renderYLabel();
        view.renderBars(processedData);
        view.renderLegend();
      }
    }

    view.renderButtonGroups();

    d3.json(dataSource, view.initialize.bind(this, filterViews.DETAIL, {
      studentSubgroup: 'All',
      year: 2013,
      subject: subjectConstants.ELA,
      mcasConstants: [
        mcasConstants.ADVANCED,
        mcasConstants.PROFICIENT,
        mcasConstants.NEEDS_IMPROVEMENT,
        mcasConstants.WARNING_FAIL
      ]
    }));
})();
