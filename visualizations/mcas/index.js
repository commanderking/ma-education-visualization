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

    const graphSelectorButtons = [
      {
        name: 'ELA - Overview',
        onClick: () => {
          renderOverviewData(subjectConstants.ELA)
        }
      },
      {
        name: 'ELA - Details',
        onClick: () => {
          renderDetailsData({ subject: subjectConstants.ELA, studentSubgroup: subgroupConsts.ALL})
        }
      },
      {
        name: 'ELA - By Subgroup',
        onClick: () => {
          renderBreakdownDataByRace({ subject: subjectConstants.ELA })
        }
      },
      {
        name: 'ELA - Trends',
        onClick: () => {
          renderTrends({ subject: subjectConstants.ELA })
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
          renderDetailsData({ subject: subjectConstants.MATH, studentSubgroup: subgroupConsts.ALL
          })
        }
      },
      {
        name: 'Math - By Subgroup',
        onClick: () => {
          renderBreakdownDataByRace({ subject: subjectConstants.MATH })
        }
      },
      {
        name: 'Math - Trends',
        onClick: () => {
          renderTrends({ subject: subjectConstants.MATH })
        }
      },
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
        const charterSummaryData = sumCharterSchools(charterSchools);
        const publicDistrictSummaryData = filterByDistrictType(studentsForSubject, 'Traditional District');
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
          year: 2014,
          subject: subject,
          mcasConstants: [
            mcasConstants.PROFICIENT_ADVANCED
          ]
        },
        loadedData
      );
    }

    const renderDetailsData = (filters) => {
      view.renderData(
        filterViews.DETAIL,
        {
          studentSubgroup: filters.studentSubgroup || subgroupConsts.ALL,
          year: 2014,
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
        { year: 2014,
          races: [subgroupConsts.BLACK, subgroupConsts.HISPANIC, subgroupConsts.ELL, subgroupConsts.SWD],
          subject: filters.subject
        },
        loadedData
      )
    }

    const renderTrends = (filters) => {
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
        return formatCharterPublicDataForSubgroup(studentDataForSubject, race);
      });
    }

    const formatCharterPublicDataForSubgroup = (data, race) => {
      const dataForRace = filterByStudentType(data, race);

      const charterSchools = filterByDistrictType(dataForRace, 'Charter');
      const charterData = sumCharterSchools(charterSchools);
      const publicStudentData = filterByDistrictType(dataForRace, 'Traditional District')[0];

      return createSubgroupAchievementData(charterData, publicStudentData, race);
    }

    const createSubgroupAchievementData = (charterData, traditionalData, race) => {
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
      const allStudentsData = filterByStudentType(data, payload.studentSubgroup);
      const allStudentsForSubject = filterBySubject(allStudentsData, payload.subject);

      const years = [2011, 2012, 2013, 2014];

      const districtsGroupedByYear = years.map((year) => {
        return allStudentsForSubject.filter((district) => {
          return district[filterConstants.YEAR] === year;
        });
      })

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

        renderYLabel({ g, svgMargins, height, text: '% students' });
        renderLegend({ g, width, z, legendItems: keys });
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

    d3.json(dataSource, view.initialize.bind(this, filterViews.DETAIL, {
      studentSubgroup: 'All',
      year: 2014,
      subject: subjectConstants.ELA,
      mcasConstants: [
        mcasConstants.ADVANCED,
        mcasConstants.PROFICIENT,
        mcasConstants.NEEDS_IMPROVEMENT,
        mcasConstants.WARNING_FAIL
      ]
    }));
})();
