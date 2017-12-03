(() => {
    const dataSource = "data.json";
    const {filterByDistrictType, filterByYear, filterByStudentType, filterBySubject } = filterUtils;
    const { renderBarsWrapper, renderBarGroups, renderRects, renderBarsText } = barGraphUtils();
    const { renderLegend } = d3Utils();

    const disciplineConsts = {
      STUDENTS: 'Students',
      STUDENTS_DISCIPLINED: 'Students Disciplined',
      IN_SCHOOL_SUSPENSION: '# In-School Suspension',
      OUT_SCHOOL_SUSPENSION: '# Out-of-School Suspension',
      EXPULSION: '# Expulsion',
      REMOVED_TO_ALTERNATE: '# Removed to Alternate Setting',
      EMERGENCY_REMOVAL: '# Emergency Removal',
    }

    const raceConsts = {
      BLACK: 'Black',
      HISPANIC: 'Hispanic/Latino'
    }

    const filterViews = {
      OVERVIEW: 'overview',
      BREAKDOWN_DISCIPLINE: 'breakdownByDiscipline',
      BREAKDOWN_RACE: 'breakdownByRace',
      TRENDS: 'trends'
    }

    const districtConstants = {
      CHARTER_SCHOOLS: "Charter",
      TRADITIONAL_PUBLIC_SCHOOLS: "Traditional District",
    }

    const filterConstants = {
      YEAR: 'Year',
      SCHOOL_TYPE: 'School Type',
      SUBGROUP: 'Subgroup'
    }

    const colorMap = {
      [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]: "#98abc5",
      [districtConstants.CHARTER_SCHOOLS]: "#8a89a6"
    }

    // Svg related Constants
    const svgMargins = {top: 20, right: 20, bottom: 70, left: 80};
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
      console.log(action);
      switch(action) {
        case filterViews.OVERVIEW:
          return filterForOverview(payload, data);
        case filterViews.BREAKDOWN_DISCIPLINE:
          return filterForBreakdownDiscipline(data)
        case filterViews.BREAKDOWN_RACE:
          return filterForRaceView(payload, data)
        case filterViews.TRENDS:
          return filterForTrends(payload, data)
        default:
          return [];
      }
    }

    filterForTrends = (payload, data) => {
      console.log('filtering for trends');
      const allStudentsData = filterByStudentType(data, payload.studentSubgroup);

      const years = ['2012-13', '2013-14', '2014-15', '2015-16'];

      const districtsGroupedByYear = years.map((year) => {
        return allStudentsData.filter((district) => {
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
          [districtConstants.CHARTER_SCHOOLS]: charterSummaryData[disciplineConsts.STUDENTS_DISCIPLINED] / charterSummaryData[disciplineConsts.STUDENTS],
          [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]: publicDistrictSummaryData[disciplineConsts.STUDENTS_DISCIPLINED] / publicDistrictSummaryData[disciplineConsts.STUDENTS]
        };
      });
      return yearlySummary;
    }

    const filterForOverview = (payload, data) => {
        // Manipulating data to get 2015 all student data
        const allStudentsData = filterByStudentType(data, payload.studentSubgroup);
        const studentDataForYear = filterByYear(allStudentsData, payload.year);
        const charterSchools = filterByDistrictType(studentDataForYear, 'Charter');
        const charterSummaryData = sumCharterSchools(charterSchools);
        const publicDistrictSummaryData = filterByDistrictType(studentDataForYear, 'Traditional District');
        const processedData = createProcessedData(
          charterSummaryData,
          publicDistrictSummaryData[0],
          payload.disciplineTypes
        );
        return processedData;
    }

    // Race view shows general discipline statistics
    const filterForRaceView = (payload, data) => {
      const studentDataForYear = filterByYear(data, payload.year);
      return payload.races.map(race => {
        return formatCharterPublicDataForRace(studentDataForYear, race);
      });
    }

    const formatCharterPublicDataForRace = (data, race) => {
      console.log(race);
      const dataForRace = filterByStudentType(data, race);

      const charterSchools = filterByDistrictType(dataForRace, 'Charter');
      const charterBlackStudentData = sumCharterSchools(charterSchools);
      const publicBlackStudentData = filterByDistrictType(dataForRace, 'Traditional District')[0];

      const charterPublicBreakdownForRace = createRaceVerticalData(charterBlackStudentData, publicBlackStudentData, race);
      return charterPublicBreakdownForRace;
    }

    const createRaceVerticalData = (charterData, traditionalData, race) => {
      return {
        name: race,
        [districtConstants.CHARTER_SCHOOLS]: calculateFractionDisciplined(charterData),
        [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]: calculateFractionDisciplined(traditionalData)
      }
    }

    const calculateFractionDisciplined = (schoolData) => {
      return schoolData[disciplineConsts.STUDENTS_DISCIPLINED] / schoolData[disciplineConsts.STUDENTS];
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
        [districtConstants.CHARTER_SCHOOLS]: charterData[category] / charterData[disciplineConsts.STUDENTS],
        [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]: traditionalData[category] / traditionalData[disciplineConsts.STUDENTS]
      }
    }

    // Creates final data structure before feeding into d3
    const createProcessedData = (charterData, traditionalData, categoriesArray) => {
      const processedData = categoriesArray.map((category) => {
        return createCategoryData(charterData, traditionalData, category);
      });

      return processedData;
    };

    const renderOverviewData = () => {
      view.renderData(
        filterViews.OVERVIEW,
        {
          studentSubgroup: 'All',
          year: '2015-16',
          disciplineTypes: [disciplineConsts.STUDENTS_DISCIPLINED]
        },
        loadedData
      );
    }
    const renderBreakdownData = () => {
      view.renderData(
        filterViews.OVERVIEW,
        {
          studentSubgroup: 'All',
          year: '2015-16',
          disciplineTypes: [
            disciplineConsts.STUDENTS_DISCIPLINED,
            disciplineConsts.IN_SCHOOL_SUSPENSION,
            disciplineConsts.OUT_SCHOOL_SUSPENSION,
            disciplineConsts.EXPULSION,
            disciplineConsts.EMERGENCY_REMOVAL
          ]
        },
        loadedData
      );
    }

    const renderBreakdownDataByRace = () => {
      view.renderData(
        filterViews.BREAKDOWN_RACE,
        { year: '2015-16',
          races: [raceConsts.BLACK, raceConsts.HISPANIC]
        },
        loadedData
      )
    }

    const renderTrends = () => {
      view.renderData(
        filterViews.TRENDS,
        { studentSubgroup: 'All' },
        loadedData
      )
    }

    const view = {
      renderButtonGroups: () => {
        const buttonGroupWrapper = document.getElementsByClassName('btn-group-wrapper')[0];
        if (buttonGroupWrapper) {
          const buttonNames = [
            {
              name: 'Overview',
              onClick: renderOverviewData
            },
            {
              name: 'Breakdown by Discipline Type',
              onClick: renderBreakdownData
            },
            {
              name: 'Breakdown by Race',
              onClick: renderBreakdownDataByRace
            },
            {
              name: 'Trends Over Time',
              onClick: renderTrends
            }
          ];

          const buttonGroup = document.createElement('div');
          buttonGroup.className = 'btn-group';
          buttonGroup.setAttribute('role', 'group');
          buttonGroup.setAttribute('aria-label', 'Basic example');

          buttonGroupWrapper.append(buttonGroup);

          buttonNames.forEach((option) => {
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
        const barsWrapper = renderBarsWrapper(data, g);
        const barsGroup = renderBarGroups({ barsWrapper, x0, keys });
        renderRects({ barsGroup, x1, y, z, height});
        renderBarsText({ barsGroup, x1, y, height });
      },

      /**
        * Data Action allows for filtering for particular slices of data
        */
      renderData: (filterView, payload, data) => {
        g.selectAll('*').remove();
        console.log('rendering data');
        if (!loadedData.length) {
          loadedData = data;
        }

        const processedData = filterController(filterView, payload, data);
        console.log(filterView);

        if (filterView === filterView.TRENDS) {
          console.log('hey, youre in trends');
        } else {
          x0.domain(processedData.map(category => category.name));
          x1.domain(keys).rangeRound([0, x0.bandwidth()]);
          y.domain([0, 0.30]);

          view.renderAxes();
          view.renderYLabel();
          view.renderBars(processedData);
          renderLegend({ g, width, z, legendItems: keys });
        }


      },
      initialize: (filterView, payload, data) => {
        console.log(filterView);
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
        y.domain([0, 0.30]);

        view.renderAxes();
        view.renderYLabel();
        view.renderBars(processedData);
        renderLegend({ g, width, z, legendItems: keys });
      }
    }

    view.renderButtonGroups();

    d3.json(dataSource, view.initialize.bind(this, filterViews.TRENDS, {
      studentSubgroup: 'All'
    }));
})();
