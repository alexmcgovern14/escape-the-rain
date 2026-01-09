#!/usr/bin/env python3
"""
Parse executions JSONL file and create analysis table for prompt 1.
Extracts: run number, team name, input articles count, output clusters count, score, explanation
"""

import json
import re
from typing import List, Dict

def extract_team_name(llm_input: str) -> str:
    """Extract team name from llm-input prompt."""
    # Pattern: "team: Team Name (Country)" or "competition: Competition Name"
    # Match everything after "team:" up to the opening parenthesis (greedy match)
    match = re.search(r'team:\s*([^\n(]+)', llm_input)
    if match:
        return match.group(1).strip()
    # Try "competition: Competition Name"
    match = re.search(r'competition:\s*([^\n]+)', llm_input)
    if match:
        return match.group(1).strip()
    return "Unknown"

def parse_jsonl_file(filepath: str) -> List[Dict]:
    """Parse JSONL file and extract relevant data."""
    results = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, start=1):
            try:
                data = json.loads(line.strip())
                
                # Only process "Summarise articles" steps
                if data.get('step-title') != 'Summarise articles':
                    continue
                
                llm_input = data.get('llm-input', '')
                llm_output = data.get('llm-output', '')
                
                # Extract team name
                team_name = extract_team_name(llm_input)
                
                # Count input articles
                # Find the articles array in llm-input - look for the JSON array after "# Articles"
                # The pattern is: "# Articles\n[\n  { ... },\n  { ... }\n]"
                articles_match = re.search(r'# Articles\s*(\[.*?\])', llm_input, re.DOTALL)
                if articles_match:
                    # Try to parse as JSON array
                    try:
                        articles_str = articles_match.group(1)
                        articles = json.loads(articles_str)
                        input_count = len(articles) if isinstance(articles, list) else 0
                    except:
                        # Fallback: count articleId occurrences
                        input_count = len(re.findall(r'"articleId"\s*:', articles_match.group(1)))
                else:
                    input_count = 0
                
                # Count output clusters
                try:
                    output_clusters = json.loads(llm_output)
                    output_count = len(output_clusters) if isinstance(output_clusters, list) else 0
                except:
                    # Fallback: count articleId in output
                    output_count = len(re.findall(r'"articleId"', llm_output))
                
                results.append({
                    'run': line_num,
                    'team': team_name,
                    'input_articles': input_count,
                    'output_clusters': output_count,
                    'score': None,  # Not in the data
                    'explanation': None  # Not in the data
                })
                
            except json.JSONDecodeError as e:
                print(f"Error parsing line {line_num}: {e}")
                continue
            except Exception as e:
                print(f"Error processing line {line_num}: {e}")
                continue
    
    return results

def generate_markdown_table(results: List[Dict]) -> str:
    """Generate markdown table from results."""
    table = "| Run | Team | Input Articles | Output Clusters | Score | Explanation |\n"
    table += "|-----|------|----------------|-----------------|-------|-------------|\n"
    
    for result in results:
        run = result['run']
        team = result['team']
        input_count = result['input_articles']
        output_count = result['output_clusters']
        score = result['score'] or "N/A"
        explanation = result['explanation'] or "N/A"
        
        table += f"| {run} | {team} | {input_count} | {output_count} | {score} | {explanation} |\n"
    
    return table

def main():
    filepath = '/Users/alex.mcgovern/Downloads/executions-export (31).jsonl'
    
    print("Parsing JSONL file...")
    results = parse_jsonl_file(filepath)
    
    print(f"\nFound {len(results)} runs\n")
    
    # Generate markdown table
    table = generate_markdown_table(results)
    
    print("## Analysis Table for Prompt 1\n")
    print(table)
    
    # Summary statistics
    print("\n## Summary Statistics\n")
    print(f"Total runs: {len(results)}")
    print(f"Average input articles: {sum(r['input_articles'] for r in results) / len(results):.2f}")
    print(f"Average output clusters: {sum(r['output_clusters'] for r in results) / len(results):.2f}")
    
    # Group by team
    from collections import defaultdict
    team_stats = defaultdict(lambda: {'runs': 0, 'total_input': 0, 'total_output': 0})
    
    for result in results:
        team = result['team']
        team_stats[team]['runs'] += 1
        team_stats[team]['total_input'] += result['input_articles']
        team_stats[team]['total_output'] += result['output_clusters']
    
    print("\n## Average Output Clusters by Team\n")
    print("| Team | Runs | Avg Input Articles | Avg Output Clusters |")
    print("|------|------|---------------------|---------------------|")
    
    for team, stats in sorted(team_stats.items(), key=lambda x: x[1]['total_output'] / x[1]['runs']):
        avg_input = stats['total_input'] / stats['runs']
        avg_output = stats['total_output'] / stats['runs']
        print(f"| {team} | {stats['runs']} | {avg_input:.2f} | {avg_output:.2f} |")

if __name__ == '__main__':
    main()

