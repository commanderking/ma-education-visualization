(() => {
    const dataSource = "data.json";
    const { filterByDistrictType, filterByYear, filterByStudentType, filterBySubject } = filterUtils;
    const { renderBarsWrapper, renderBarGroups, renderRects, renderBarsText, renderAxes, renderYLabel } = barGraphUtils();
    const { scaleRanges, renderLine } = lineGraphUtils();
    const { renderLegend, renderXAxis, renderYAxis } = d3Utils();

    const attritionConstants = {
      STUDENT_COUNT: 'All total',
      ATTRITION_COUNT: 'Attrition',
      ATTRITION_COUNT_K: 'K',
      ATTRITION_COUNT_1: '1',
      ATTRITION_COUNT_2: '2',
      ATTRITION_COUNT_3: '3',
      ATTRITION_COUNT_4: '4',
      ATTRITION_COUNT_5: '5',
      ATTRITION_COUNT_6: '6',
      ATTRITION_COUNT_7: '7',
      ATTRITION_COUNT_8: '8',
      ATTRITION_COUNT_9: '9',
      ATTRITION_COUNT_10: '10',
      ATTRITION_COUNT_11: '11',
      TOTAL_COUNT_K: 'K total',
      TOTAL_COUNT_1: '1 total',
      TOTAL_COUNT_2: '2 total',
      TOTAL_COUNT_3: '3 total',
      TOTAL_COUNT_4: '4 total',
      TOTAL_COUNT_5: '5 total',
      TOTAL_COUNT_6: '6 total',
      TOTAL_COUNT_7: '7 total',
      TOTAL_COUNT_8: '8 total',
      TOTAL_COUNT_9: '9 total',
      TOTAL_COUNT_10: '10 total',
      TOTAL_COUNT_11: '11 total',
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
    const yDomainMax = 0.2; // Max % for y-axis label
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
        case filterViews.TRENDS:
          return filterForTrends(payload, data);
        default:
          return [];
      }
    }

    const filterForOverview = (payload, data) => {
        // Manipulating data to get 2015 all student data
        const allStudentsData = filterByStudentType(data, payload.studentSubgroup);
        const studentDataForYear = filterByYear(allStudentsData, payload.year);
        const charterSchools = filterByDistrictType(studentDataForYear, districtConstants.CHARTER_SCHOOLS);
        const charterSummaryData = sumCharterSchools(charterSchools);
        const publicDistrictSummaryData = filterByDistrictType(studentDataForYear, districtConstants.TRADITIONAL_PUBLIC_SCHOOLS);

        const processedData = createProcessedData(
          charterSummaryData,
          publicDistrictSummaryData[0],
          payload.categories
        );
        return processedData;
    }

    const filterForTrends = (payload, data) => {
      const allStudentsData = filterByStudentType(data, payload.studentSubgroup);

      const years = ['2011-12', '2012-13', '2013-14', '2014-15', '2015-16', '2016-17'];

      const districtsGroupedByYear = years.map((year) => {
        return allStudentsData.filter((district) => {
          return district[filterConstants.YEAR] === year;
        });
      })

      const yearlySummary = districtsGroupedByYear.map((districtsInYear) => {
        const charterSchools = filterByDistrictType(districtsInYear, districtConstants.CHARTER_SCHOOLS);
        const charterSummaryData = sumCharterSchools(charterSchools);
        const publicDistrictSummaryData = filterByDistrictType(districtsInYear, districtConstants.TRADITIONAL_PUBLIC_SCHOOLS)[0];

        return {
          name: districtsInYear[0][filterConstants.YEAR],
          [districtConstants.CHARTER_SCHOOLS]: charterSummaryData[attritionConstants.ATTRITION_COUNT] / charterSummaryData[attritionConstants.STUDENT_COUNT],
          [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]: publicDistrictSummaryData[attritionConstants.ATTRITION_COUNT] / publicDistrictSummaryData[attritionConstants.STUDENT_COUNT]
        };
      });

      return yearlySummary;
    }


    // Takes all charter school entries, sums up data, and creates new object with select properties summed
    const sumCharterSchools = (data) => {
      const charterSummaryData = {
        schoolType: 'Charter',
        districtName: 'Boston Charter Schools',
      }

      _.forOwn(attritionConstants, constant => {
        charterSummaryData[constant] = 0;
      });

      data.forEach((school) => {
        _.forOwn(attritionConstants, constant => {
          charterSummaryData[constant] += school[constant] || 0;
        })
      });
      return charterSummaryData;
    }

    const createCategoryData = (charterData, traditionalData, category) => {
      if (category === attritionConstants.ATTRITION_COUNT) {
        return {
          name: category,
          [districtConstants.CHARTER_SCHOOLS]: charterData[category] / charterData[attritionConstants.STUDENT_COUNT],
          [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]: traditionalData[category] / traditionalData[attritionConstants.STUDENT_COUNT]
        }
      } else {
        return {
          name: category,
          [districtConstants.CHARTER_SCHOOLS]: charterData[category] / charterData[category + " total"],
          [districtConstants.TRADITIONAL_PUBLIC_SCHOOLS]: traditionalData[category] / traditionalData[category + " total"]
        }
      }
    }

    // Creates final data structure before feeding into d3
    const createProcessedData = (charterData, traditionalData, categoriesArray) => {
      const processedData = categoriesArray.map((category) => {
        return createCategoryData(charterData, traditionalData, category);
      });
      // Hard code to omit extra data from seeping to graph for K-12 trends
      const filteredData = processedData.filter(grade => {
        return !grade.name.includes('total');
      })
      return filteredData;
    };

    const renderOverviewData = () => {
      view.renderData(
        filterViews.OVERVIEW,
        {
          studentSubgroup: 'All',
          year: '2016-17',
          categories: [attritionConstants.ATTRITION_COUNT]
        },
        loadedData
      );
    };

    const renderDetailData = () => {
      const categories = [];
      const gradeLevelAttrition = _.omit(attritionConstants, ['STUDENT_COUNT', 'ATTRITION_COUNT']);

      _.forOwn(gradeLevelAttrition, constant => {
        categories.push(constant);
      });

      view.renderData(
        filterViews.OVERVIEW,
        {
          studentSubgroup: 'All',
          year: '2016-17',
          categories
        },
        loadedData
      );
    };

    const renderTrends = () => {
      view.renderData(
        filterViews.TRENDS,
        {
          studentSubgroup: 'All'
        },
        loadedData
      )
    }

    const graphSelectorButtons = [
      {
        name: 'Overview',
        onClick: renderOverviewData
      },
      {
        name: 'Grade Breakdown',
        onClick: renderDetailData
      },
      {
        name: 'Trends',
        onClick: renderTrends
      }
    ];

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

          renderXAxis({ g, height, x, tickCount: processedData.length });
          renderYAxis({ g, height, y, tickCount: 5});
        } else {
          // Bar graph
          x0.domain(processedData.map(category => category.name));
          x1.domain(keys).rangeRound([0, x0.bandwidth()]);
          y.domain([0, yDomainMax]);

          renderAxes({ g, x0, y, height });
          view.renderBars(processedData);
        }

        // Always render a legend
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
      studentSubgroup: 'All',
      year: '2016-17',
      categories: [attritionConstants.ATTRITION_COUNT]
    }));
})();
