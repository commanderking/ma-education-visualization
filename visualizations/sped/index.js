(() => {
  // filterUtils defined in html file
  const { filterByDistrictType, filterByYear, filterByStudentType, filterBySubject } = filterUtils;
  const { renderBarsWrapper, renderBarGroups, renderRects, renderBarsText, renderAxes, renderYLabel } = barGraphUtils();
  const { scaleRanges, renderLine } = lineGraphUtils();
  const { renderLegend, renderXAxis, renderYAxis } = d3Utils();
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

    const populationConstants = {
      ELL: 'English Language Learner',
      DISABILITIES: 'Students With Disabilities',
      HIGH_NEEDS: 'High Needs',
      ECONOMICALLY_DISADVANTAGED: 'Economically Disadvantaged',
      STUDENT_COUNT: 'Total student population',
    }

    const filterViews = {
      OVERVIEW: 'overview',
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

    const graphSelectorButtons = [
      {
        name: 'Overview',
        onClick: () => {
          renderOverviewData(subjectConstants.ELA)
        },
      },
      {
        name: 'Trends - ELL',
        onClick: () => {
          renderTrends(populationConstants.ELL);
        }
      },
      {
        name: 'Trends - Disabilities',
        onClick: () => {
          renderTrends(populationConstants.DISABILITIES);
        }
      },
      {
        name: 'Trends - Economically Disadvantaged',
        onClick: () => {
          renderTrends(populationConstants.ECONOMICALLY_DISADVANTAGED);
        }
      }
    ];

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
        const charterSummaryData = sumCharterSchools(charterSchools);
        const publicDistrictSummaryData = filterByDistrictType(studentsForSubject, 'Traditional District');
        const processedData = createProcessedData(
          charterSummaryData,
          publicDistrictSummaryData[0],
          payload.subgroupConstants
        );
        return processedData;
    }
    // Takes all charter school entries, sums up data, and creates new object with select properties summed
    const sumCharterSchools = (data) => {
      const charterSummaryData = {
        schoolType: 'Charter',
        districtName: 'Boston Charter Schools',
      }

      _.forOwn(populationConstants, constant => {
        charterSummaryData[constant] = 0;
      });

      data.forEach((school) => {
        _.forOwn(populationConstants, constant => {
          charterSummaryData[constant] += school[constant] || 0;
        })
      });

      return charterSummaryData;
    }

    const createCategoryData = (charterData, traditionalData, category) => {
        return {
          name: category,
          [districtConstants.CHARTER_SCHOOLS]: charterData[category] / charterData[populationConstants.STUDENT_COUNT],
          [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]: traditionalData[category] / traditionalData[populationConstants.STUDENT_COUNT]
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
          year: '2016-17',
          subgroupConstants: [
            populationConstants.ELL,
            populationConstants.DISABILITIES,
            populationConstants.ECONOMICALLY_DISADVANTAGED
          ]
        },
        loadedData
      );
    }

    const renderTrends = (subgroup) => {
      view.renderData(
        filterViews.TRENDS,
        { subgroup },
        loadedData
        )
    };

    filterForTrends = (payload, data) => {
      const { subgroup } = payload;
      let years;
      if (subgroup === populationConstants.ELL || subgroup === populationConstants.DISABILITIES) {
        years =  ['2011-12', '2012-13', '2013-14', '2014-15', '2015-16', '2016-17']
      } else {
        years = ['2014-15', '2015-16', '2016-17'];
      }

      const districtsGroupedByYear = years.map((year) => {
        return data.filter((district) => {
          return district[filterConstants.YEAR] === year;
        });
      })

      const yearlySummary = districtsGroupedByYear.map((districtsInYear) => {
        const charterSchools = filterByDistrictType(districtsInYear, districtConstants.CHARTER_SCHOOLS);
        const charterSummaryData = sumCharterSchools(charterSchools);
        const publicDistrictSummaryData = filterByDistrictType(districtsInYear, districtConstants.TRADITIONAL_PUBLIC_SCHOOLS)[0];

        return {
          name: districtsInYear[0][filterConstants.YEAR],
          [districtConstants.CHARTER_SCHOOLS]: calculateFractionSubgroup(charterSummaryData, payload.subgroup),
          [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]: calculateFractionSubgroup(publicDistrictSummaryData, payload.subgroup)
        };
      });
      return yearlySummary;
    };

    const calculateFractionSubgroup = (district, subgroup) => {
      return district[subgroup] / district[populationConstants.STUDENT_COUNT];
    }

    const view = {

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
        if (!loadedData.length) {
          loadedData = data;
        }

        const processedData = filterController(filterView, payload, data);

        if (filterView === filterViews.TRENDS) {
          // Line graph
          x = d3.scaleTime().range([50, width]);
          y = d3.scaleLinear().range([height, 0]);

          scaleRanges({ data: processedData, x, y, yDomainMax });

          // render charter school line
          renderLine({
            data: processedData,
            g,
            x,
            y,
            yKey: districtConstants.CHARTER_SCHOOLS,
            lineColor: colorMap[districtConstants.CHARTER_SCHOOLS]
          });

          renderLine({
            data: processedData,
            g,
            x,
            y,
            yKey: districtConstants.TRADITIONAL_PUBLIC_SCHOOLS,
            lineColor: colorMap[districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]
          });

          renderXAxis({ g, height, x });
          renderYAxis({ g, height, y, tickCount: 5});
        } else {
          x0.domain(processedData.map(category => {
            return category.name;
          }));
          x1.domain(keys).rangeRound([0, x0.bandwidth()]);
          y.domain([0, yDomainMax]);

          renderAxes({ g, x0, y, height });
          view.renderBars(processedData);
        }
        renderLegend({ g, width, z, legendItems: keys });
        renderYLabel({ g, svgMargins, height, text: '% students' });
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

        renderAxes({ g, x0, y, height });
        renderYLabel({ g, svgMargins, height, text: '% students' });
        view.renderBars(processedData);
        renderLegend({ g, width, z, legendItems: keys });
      }
    }

    const graphSelectorButtonsWrapper = document.getElementsByClassName('btn-group-wrapper')[0];
    renderGraphSelectorButtons(graphSelectorButtons, graphSelectorButtonsWrapper);

    d3.json(dataSource, view.initialize.bind(this, filterViews.OVERVIEW, {
      year: '2016-17',
      subgroupConstants: [
        populationConstants.ELL,
        populationConstants.DISABILITIES,
        populationConstants.ECONOMICALLY_DISADVANTAGED
      ]
    }));
})();
