/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    04/11/2016
 Author:     Chris Brame

 **/

define('pages/reportsBreakdown', [
    'jquery',
    'underscore',
    'modules/helpers',
    'countup',
    'c3',
    'd3pie',
    'moment',
    'metricsgraphics',
    'peity',
    'history'

], function($, _, helpers, CountUp, c3, d3pie, moment) {
    var reportsBreakdownPage = {};

    reportsBreakdownPage.init = function() {
        $(document).ready(function() {
            var testPage = $('#page-content').find('.reportsBreakdown');
            if (testPage.length < 1) return;

            helpers.resizeAll();

            var parms = {
                full_width: true,
                height: 250,
                target: '#test',
                x_accessor: 'date',
                y_accessor: 'value',
                y_extended_ticks: true,
                show_tooltips: false,
                aggregate_rollover: true,
                transition_on_update: false,
                colors: ['green', 'red']
            };

            $('#select_group').on('change', function() {
                var self = $(this);
                getData(self.val());
            });

            function getData(group) {
                $.ajax({
                        url: '/api/v1/tickets/stats/group/' + group,
                        method: 'GET',
                        success: function(_data) {
                            if (!_data.data.graphData)
                                return;

                            parms.data = MG.convert.date(_data.data.graphData, 'date');
                            MG.data_graphic(parms);

                            var tCount = _(_data.data.graphData).reduce(function(m, x) { return m + x.value; }, 0);
                            var ticketCount = $('#ticketCount');
                            var oldTicketCount = ticketCount.text() == '--' ? 0 : ticketCount.text();
                            var totalTicketText = 'Total Tickets (lifetime)';
                            ticketCount.parents('.tru-card-content').find('span.uk-text-small').text(totalTicketText);
                            var theAnimation = new CountUp('ticketCount', oldTicketCount, tCount, 0, 1.5);
                            theAnimation.start();

                            var closedCount = Number(_data.data.closedCount);
                            var closedPercent = Math.round((closedCount / tCount) * 100);

                            var textComplete = $('#text_complete');
                            var oldTextComplete = textComplete.text() == '--' ? 0 : textComplete.text();
                            var completeAnimation = new CountUp('text_complete', oldTextComplete, closedPercent, 0, 1.5);
                            completeAnimation.start();

                            var pieComplete = $('#pie_complete');
                            pieComplete.text(closedPercent + '/100');
                            pieComplete.peity("donut", {
                                height: 24,
                                width: 24,
                                fill: ["#29b955", "#ccc"]
                            });

                            var responseTime_text = $('#responseTime_text');
                            var responseTime_graph = $('#responseTime_graph');
                            var oldResponseTime = responseTime_text.text() == '--' ? 0 : responseTime_text.text();
                            var responseTime = _data.data.avgResponse;
                            var responseTime_animation = new CountUp('responseTime_text', oldResponseTime, responseTime, 0, 1.5);
                            responseTime_animation.start();

                            var recentTicketsBody = $('tbody.recent-tickets');
                            recentTicketsBody.html('');
                            var html = '';
                            var sortedTickets = _.sortBy(_data.data.recentTickets, 'uid').reverse();
                            _.each(sortedTickets, function(ticket) {
                                var status = '';
                                switch(ticket.status) {
                                    case 0:
                                        status = 'new';
                                        break;
                                    case 1:
                                        status = 'open';
                                        break;
                                    case 2:
                                        status = 'pending';
                                        break;
                                    case 3:
                                        status = 'closed';
                                        break;
                                }
                                    html += '<tr class="uk-table-middle">';
                                    html += '<td class="uk-width-1-10 uk-text-nowrap"><a href="/tickets/' + ticket.uid + '">T#' + ticket.uid + '</a></td>';
                                    html += '<td class="uk-width-1-10 uk-text-nowrap"><span class="uk-badge ticket-status-' + status + ' uk-width-1-1">' + status + '</span></td>';
                                    html += '<td class="uk-width-6-10">';
                                    html += ticket.subject;
                                    html += '</td>';
                                    html += '<td class="uk-width-2-10 uk-text-right uk-text-muted uk-text-small">';
                                    html += moment(ticket.updated).format('MM.DD.YYYY');
                                    html += '</td>';
                                    html += '</tr>';
                            });

                            recentTicketsBody.append(html);

                            var arr = _.map(_data.data.tags, function(v, key) {
                                return [key, v];
                            });

                            var colors = [
                                '#e53935',
                                '#d81b60',
                                '#8e24aa',
                                '#1e88e5',
                                '#00897b',
                                '#43a047',
                                '#00acc1',
                                '#e65100',
                                '#6d4c41',
                                '#455a64'
                            ];

                            var c = _.object(_.map(arr, function(v,i) {
                                return v[0];
                            }), colors);

                            c3.generate({
                                bindto: d3.select('#topTags'),
                                size: {
                                    height: 200
                                },
                                data: {
                                    columns: arr,
                                    type: 'donut',
                                    colors: c
                                },
                                donut: {
                                    label: {
                                        format: function (value, ratio, id) {
                                            return '';
                                        }
                                    }
                                }
                            });

                            helpers.UI.matchHeight();
                        }
                    })
                    .error(function(err) {
                        //console.log(err);
                        console.log('[trudesk:dashboard:getData] Error - ' + err.responseText);
                        helpers.UI.showSnackbar(JSON.parse(err.responseText).error, true);
                    });
            }
        });
    };

    return reportsBreakdownPage;
});